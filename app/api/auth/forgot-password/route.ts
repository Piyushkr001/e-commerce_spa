import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { generateResetToken } from "@/lib/reset-token";
import { sendMail } from "@/lib/email";
import { db } from "@/config/db";
import { passwordResetTokens, usersTable } from "@/config/schema";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Token lifetime in minutes
const EXP_MIN = 30;

export async function POST(req: Request) {
  try {
    const { email } = await req.json() as { email?: string };
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Look up user (if not found, still return success to avoid leaking)
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
    const user = users[0];

    if (user) {
      const { raw, hash } = generateResetToken();
      const expiresAt = new Date(Date.now() + EXP_MIN * 60 * 1000);

      // Optionally: invalidate previous tokens for this user
      // Not required, but cleaner to keep a single active token:
      // await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash: hash,
        expiresAt,
      });

      const resetLink = `${APP_URL}/reset-password?token=${raw}`;
      const html = `
        <p>Hello ${user.name || ""},</p>
        <p>We received a request to reset your Bazario password.</p>
        <p><a href="${resetLink}">Click here to reset your password</a> (valid for ${EXP_MIN} minutes).</p>
        <p>If you didn’t request this, you can safely ignore this email.</p>
      `;

      await sendMail({
        to: user.email,
        subject: "Reset your Bazario password",
        html,
        text: `Reset your password: ${resetLink}`,
      });
    }

    // Always return success (avoid user enumeration)
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[forgot-password] error", e);
    // Still return 200 to not leak which emails exist
    return NextResponse.json({ ok: true });
  }
}

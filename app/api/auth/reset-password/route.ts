import { NextResponse } from "next/server";
import { eq, and, isNull, gt } from "drizzle-orm";
import crypto from "crypto";
import { hashPassword } from "@/lib/password";
import { db } from "@/config/db";
import { passwordResetTokens, usersTable } from "@/config/schema";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json() as { token?: string; password?: string };
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Hash the incoming token to match what we stored
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find a valid (not used, not expired) token row
    const now = new Date();
    const rows = await db.select().from(passwordResetTokens).where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      )
    );

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Update user's password
    const newHash = await hashPassword(password);
    await db.update(usersTable)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(usersTable.id, row.userId));

    // Mark token as used (one-time)
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, row.id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reset-password] error", e);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}

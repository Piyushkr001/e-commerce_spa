import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { signAppJwt } from "@/lib/jwt";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check existing user
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const inserted = await db
      .insert(usersTable)
      .values({
        name,
        email,
        passwordHash,
      })
      .returning();

    const user = inserted[0];
    const token = signAppJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl ?? undefined,
    });

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (e) {
    console.error("[/api/auth/signup] error:", e);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}

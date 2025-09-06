import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { comparePassword } from "@/lib/password";
import { signAppJwt } from "@/lib/jwt";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email));
    const user = rows[0];
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signAppJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl ?? undefined,
    });

    return NextResponse.json({ token, user }, { status: 200 });
  } catch (e) {
    console.error("[/api/auth/login] error:", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

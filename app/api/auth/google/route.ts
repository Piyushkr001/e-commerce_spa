import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { verifyGoogleIdToken } from "@/lib/google";
import { signAppJwt } from "@/lib/jwt";
import { usersTable } from "@/config/schema";
import { db } from "@/config/db";

/**
 * POST /api/auth/google
 * Body: { idToken: string }
 * 
 * Expects an ID token from @react-oauth/google's <GoogleLogin onSuccess={(cred)=> cred.credential } />
 * Verifies token, upserts user, returns app JWT.
 */
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "idToken required" }, { status: 400 });
    }

    const payload = await verifyGoogleIdToken(idToken);
    if (!payload) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    const email = payload.email;
    const name = payload.name || "User";
    const picture = payload.picture || null;

    if (!email) {
      return NextResponse.json({ error: "Email missing in Google token" }, { status: 400 });
    }

    // find user
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    let user = existing[0];

    // upsert
    if (!user) {
      const inserted = await db
        .insert(usersTable)
        .values({
          name,
          email,
          imageUrl: picture ?? undefined,
          // createdAt & updatedAt default via DB
        })
        .returning();
      user = inserted[0];
    } else {
      // Optional: keep profile fresh on login
      const updated = await db
        .update(usersTable)
        .set({ name, imageUrl: picture ?? undefined, updatedAt: new Date() })
        .where(eq(usersTable.id, user.id))
        .returning();
      user = updated[0];
    }

    // issue app JWT
    const token = signAppJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl ?? undefined,
    });

    return NextResponse.json({ token, user });
  } catch (err) {
    console.error("[/api/auth/google] error:", err);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }
}

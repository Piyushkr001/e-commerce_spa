/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET missing");

export type JwtPayload = {
  sub?: string;
  id?: string;
  userId?: string;
  [k: string]: any;
};

export function requireAuth(req: Request): { userId: string } {
  const hdr = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!hdr || !hdr.startsWith("Bearer ")) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  try {
    const token = hdr.slice("Bearer ".length).trim();
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const userId = decoded.sub || decoded.userId || decoded.id; // ✅ accept id as fallback
    if (!userId) throw new Error("No user id claim");

    return { userId: String(userId) };
  } catch {
    throw Object.assign(new Error("Invalid token"), { status: 401 });
  }
}

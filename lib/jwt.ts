import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;
type Payload = { id: string; email: string; name?: string; imageUrl?: string };

export function signAppJwt(payload: Payload) {
  return jwt.sign(payload, SECRET, { algorithm: "HS256", expiresIn: "7d" });
}

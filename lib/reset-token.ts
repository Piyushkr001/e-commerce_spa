import crypto from "crypto";

/** Generates a cryptographically strong token (raw) and its SHA256 hash */
export function generateResetToken() {
  const raw = crypto.randomBytes(32).toString("hex"); // 64 chars
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

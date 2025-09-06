import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID token (JWT) coming from @react-oauth/google's <GoogleLogin />
 * and returns the payload with email/name/picture/etc.
 */
export async function verifyGoogleIdToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload(); // may include: email, name, picture, sub, email_verified
}

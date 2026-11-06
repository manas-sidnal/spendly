import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "session";
export const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === "change-me") {
    throw new Error("AUTH_SECRET is not set. Generate one with: openssl rand -base64 32");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

export async function verifyToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

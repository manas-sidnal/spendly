import { cookies } from "next/headers";
import { COOKIE_NAME, MAX_AGE, signToken, verifyToken } from "./jwt";

export async function createSession(userId: string) {
  const token = await signToken(userId);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

/** Returns the logged-in user's id, or null. */
export async function getUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

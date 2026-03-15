import { cookies } from "next/headers";

const SESSION_COOKIE = "draftboard_session";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  const token = getSessionToken();
  if (!token) return false;
  return session?.value === token;
}

export function getSessionToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return Buffer.from(password).toString("base64");
}

export function verifyPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return input === password;
}

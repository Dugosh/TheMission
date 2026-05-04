import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "ht_session";

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function makeSessionToken(): string {
  const issued = Date.now().toString();
  return `${issued}.${sign(issued)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [issued, sig] = token.split(".");
  if (!issued || !sig) return false;
  if (sign(issued) !== sig) return false;
  // 60 days
  const age = Date.now() - parseInt(issued, 10);
  return age >= 0 && age < 1000 * 60 * 60 * 24 * 60;
}

export async function isAuthed(): Promise<boolean> {
  const c = await cookies();
  return verifySessionToken(c.get(COOKIE_NAME)?.value);
}

export const SESSION_COOKIE = COOKIE_NAME;

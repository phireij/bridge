/**
 * Staff admin gate — server-side shared passcode. The passcode is verified only
 * on the server; the browser only ever holds an httpOnly cookie containing a
 * SHA-256 of the passcode (never the passcode itself). No secret is client-side.
 */
import "server-only";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

const COOKIE = "rcd_admin";
const MAX_AGE = 60 * 60 * 12; // 12h

/** Configured passcode, or a documented dev fallback when unset. */
function expectedPasscode(): string {
  return process.env.ADMIN_PASSCODE ?? "ruby-dev";
}
export function isDefaultPasscode(): boolean {
  return !process.env.ADMIN_PASSCODE;
}
function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
function equalHex(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function isAdminAuthed(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  return equalHex(token, sha(expectedPasscode()));
}

/** Returns true and sets the session cookie when the passcode matches. */
export async function signIn(passcode: string): Promise<boolean> {
  if (!equalHex(sha(passcode), sha(expectedPasscode()))) return false;
  (await cookies()).set(COOKIE, sha(expectedPasscode()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

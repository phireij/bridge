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

/** True when running on Vercel (preview or production). */
function deployed(): boolean {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}
/**
 * Configured passcode, or a dev fallback ONLY when running locally. In a
 * deployed environment with no ADMIN_PASSCODE set, admin is treated as
 * unconfigured (all sign-ins refused) rather than accepting a known default.
 */
function expectedPasscode(): string | null {
  if (process.env.ADMIN_PASSCODE) return process.env.ADMIN_PASSCODE;
  return deployed() ? null : "ruby-dev";
}
export function isAdminConfigured(): boolean {
  return expectedPasscode() !== null;
}
export function isDefaultPasscode(): boolean {
  return !process.env.ADMIN_PASSCODE && !deployed();
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
  const expected = expectedPasscode();
  if (!expected) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  return equalHex(token, sha(expected));
}

/** Returns true and sets the session cookie when the passcode matches. */
export async function signIn(passcode: string): Promise<boolean> {
  const expected = expectedPasscode();
  if (!expected) return false;
  if (!equalHex(sha(passcode), sha(expected))) return false;
  (await cookies()).set(COOKIE, sha(expected), {
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

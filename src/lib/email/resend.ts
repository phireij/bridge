/**
 * Server-only Resend client. Lazily constructed so the module can be imported
 * from server contexts even when RESEND_API_KEY is not set (in which case
 * `getResend()` returns null and callers must skip the send).
 */
import "server-only";
import { Resend } from "resend";

let cached: Resend | null | undefined;

export function getResend(): Resend | null {
  if (cached !== undefined) return cached;
  const key = process.env.RESEND_API_KEY;
  cached = key ? new Resend(key) : null;
  return cached;
}

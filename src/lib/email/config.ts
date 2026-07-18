import "server-only";

import { SHOP } from "@/lib/reservations/config";

/**
 * Email provider gate. When false, `/reserve` hides the email input and the
 * server-side DAL strips any email — per CTO escape hatch, we never collect
 * customer addresses we cannot use.
 */
export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

/** Build the `From:` header — accepts bare email or "Name <email>" formats. */
export function fromHeader(): string {
  const v = process.env.RESEND_FROM_EMAIL?.trim() ?? "";
  if (!v) return "";
  return v.includes("<") ? v : `${SHOP.name} <${v}>`;
}

/** Optional reply-to override; defaults to the from address. */
export function replyToHeader(): string | undefined {
  const rt = process.env.RESEND_REPLY_TO?.trim();
  return rt || undefined;
}

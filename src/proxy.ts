/**
 * Mission #001K — public-facing landing UX (Next.js 16 proxy convention).
 *
 * When a customer hits the reservation domain root (`reservations.rubyscakedelights.shop/`),
 * transparently serve the reservation experience instead of the Bridge HQ
 * homepage. The URL stays as `/` in the browser (rewrite, not redirect), so:
 *
 *   - No extra HTTP round-trip for customers.
 *   - `/reserve` continues to work on both hosts (bookmarkable, no regression).
 *   - Bridge HQ homepage `/` is unaffected on any other host (e.g.
 *     `bridge-gray-one.vercel.app/` still shows the HQ dashboard).
 *   - The reservation admin at `/admin` remains reachable on both hosts.
 *
 * No changes to reservation logic, authentication, or database behavior — the
 * middleware only picks WHICH page component to render for one specific path
 * on one specific host.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RESERVATION_HOSTS = new Set([
  "reservations.rubyscakedelights.shop",
  "www.reservations.rubyscakedelights.shop", // defensive: some DNS configs add www
]);

export function proxy(req: NextRequest) {
  // `host` includes port for non-standard ports; strip it so :443 / :80 don't
  // slip past the allow-list. Also lowercase for case-insensitive matching.
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (RESERVATION_HOSTS.has(host) && req.nextUrl.pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/reserve";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

// Only run on the site root — every other route (including all /reserve, /admin,
// /_next/*, etc.) is untouched.
export const config = {
  matcher: ["/"],
};

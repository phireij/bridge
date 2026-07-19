/**
 * Host-aware middleware — two modes:
 *
 * 1. Reservation domain (reservations.rubyscakedelights.shop):
 *    Only /reserve and /admin are valid.  Everything else (root, /login,
 *    Bridge HQ routes) redirects to /reserve.  The reservation domain
 *    must never expose Bridge HQ authentication.
 *
 * 2. Bridge HQ hostname (Vercel Production/Preview URL):
 *    Existing behavior: Supabase Auth gate on (app) routes; /login,
 *    /reserve, /admin, /api are public.
 *
 * All /api/* routes are left alone: they use Bearer tokens
 * (HyperAgent/Hermes Supabase sessions), not browser cookies.
 */
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const RESERVATION_HOST = "reservations.rubyscakedelights.shop";

/** Bridge HQ routes that must NOT be accessible from the reservation domain. */
const BRIDGE_ONLY_PATHS = [
  "/login", "/inbox", "/cto", "/missions", "/memory", "/workforce",
  "/settings", "/reports",
];

/** Public on any hostname — reservation flow and Ruby staff admin. */
const ALWAYS_PUBLIC = ["/reserve", "/admin", "/api"];

function isReservationHost(hostname: string): boolean {
  return hostname === RESERVATION_HOST;
}

function matchPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // ── Reservation domain routing ────────────────────────────────────
  if (isReservationHost(hostname)) {
    // Root → /reserve
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/reserve", request.url));
    }
    // /login or any Bridge-only route → /reserve
    if (matchPath(pathname, BRIDGE_ONLY_PATHS) || pathname === "/login") {
      return NextResponse.redirect(new URL("/reserve", request.url));
    }
    // /reserve and /admin pass through
    return NextResponse.next({ request });
  }

  // ── Bridge HQ routing (Vercel Production / Preview) ───────────────
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getUser();

  if (!data.user && !matchPath(pathname, ALWAYS_PUBLIC)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (data.user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

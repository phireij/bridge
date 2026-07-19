/**
 * Refreshes the Bridge HQ Supabase session on every request and gates the
 * authenticated app shell. Unauthenticated visitors to any `(app)` route are
 * redirected to /login. `/login`, `/reserve` (public reservation flow),
 * `/admin` (Ruby staff admin, its own passcode gate), static assets, and
 * Next.js internals are left alone.
 *
 * All `/api/*` routes are also left alone here: they are called with an
 * `Authorization: Bearer <token>` header (HyperAgent/Hermes's own Supabase
 * session), not a browser cookie session, so this cookie-based redirect
 * would otherwise 302 every agent API call to /login. Each API route is
 * responsible for validating its own Bearer token (see src/app/api/reports/
 * route.ts) — this middleware's job is the cookie-session page gate only.
 *
 * ── Mission #002F — Domain Isolation Hotfix ─────────────────────────────
 * The reservation system's public custom domain (RESERVATION_HOST) and
 * Bridge HQ currently share one Vercel deployment. Before this fix, an
 * unauthenticated visit to that domain's `/` redirected to `/login?next=/`
 * — exposing Bridge's internal sign-in page to reservation customers. On
 * RESERVATION_HOST, only `/reserve` and `/admin` (the customer flow and the
 * Ruby staff dashboard, both host-agnostic already) are reachable; every
 * other path — including `/`, `/login`, and every Bridge-only route —
 * redirects to `/reserve`. This check runs first and short-circuits before
 * any Bridge Supabase/auth logic, so it can never depend on or affect the
 * Bridge session gate below. Bridge HQ itself keeps working exactly as
 * before on every other hostname (the Vercel production URL today; a
 * future dedicated company domain later — see the domain-separation plan).
 */
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/reserve", "/admin", "/api"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const RESERVATION_HOST = "reservations.rubyscakedelights.shop";
const RESERVATION_ALLOWED_PATHS = ["/reserve", "/admin"];

function isReservationAllowedPath(pathname: string) {
  return RESERVATION_ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host")?.split(":")[0] ?? request.nextUrl.hostname;

  // ── Reservation domain: never expose Bridge HQ or its login ──────────
  if (hostname === RESERVATION_HOST) {
    if (!isReservationAllowedPath(pathname)) {
      return NextResponse.redirect(new URL("/reserve", request.url));
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY;

  // Bridge HQ Supabase not configured on this environment — fail safe by
  // leaving routes as-is rather than crashing every request. The (app)
  // layout also independently gates on a resolved profile.
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

  if (!data.user && !isPublicPath(pathname)) {
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

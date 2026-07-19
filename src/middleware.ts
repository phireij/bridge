/**
 * Refreshes the Bridge HQ Supabase session on every request and gates the
 * authenticated app shell. Unauthenticated visitors to any `(app)` route are
 * redirected to /login. `/login`, `/reserve` (public reservation flow),
 * `/admin` (Ruby staff admin, its own passcode gate), static assets, and
 * Next.js internals are left alone.
 */
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/reserve", "/admin", "/api/health"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
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
  const { pathname } = request.nextUrl;

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

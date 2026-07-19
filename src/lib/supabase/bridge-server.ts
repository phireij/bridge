/**
 * Server-side Supabase client for the Bridge Lite Operational HQ project
 * (`bridge-hq`). Uses the Next.js cookie store so auth sessions flow through
 * Server Components, Server Actions, and Route Handlers.
 *
 * Requires NEXT_PUBLIC_BRIDGE_SUPABASE_URL and NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY.
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createBridgeServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Bridge HQ Supabase env vars missing. Set NEXT_PUBLIC_BRIDGE_SUPABASE_URL and NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY.",
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore, middleware
          // refreshes the session on the next request.
        }
      },
    },
  });
}

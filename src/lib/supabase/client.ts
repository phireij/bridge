/**
 * Browser-side Supabase client (scaffold).
 *
 * Bridge v0.1 renders from a seeded data layer (see `src/lib/data`), so this
 * client is not yet wired into any page. It's here so that swapping the DAL
 * over to live Supabase queries is a drop-in change once the project's
 * tables exist.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or keep using the seeded data layer.",
    );
  }

  return createBrowserClient(url, anonKey);
}

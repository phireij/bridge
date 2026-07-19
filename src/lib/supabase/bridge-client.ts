/**
 * Browser-side Supabase client for the Bridge Lite Operational HQ project
 * (`bridge-hq` — separate from the Ruby reservations Supabase project; see
 * AGENTS.md for the project map). Used by the login page and any client
 * component that needs an authenticated session.
 *
 * Requires NEXT_PUBLIC_BRIDGE_SUPABASE_URL and NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createBridgeClient() {
  const url = process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Bridge HQ Supabase env vars missing. Set NEXT_PUBLIC_BRIDGE_SUPABASE_URL and NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserClient(url, anonKey);
}

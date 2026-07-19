import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for Bridge HQ (bridge-hq project). Bypasses
 * RLS entirely — only ever use this for operations that genuinely need
 * elevated privilege and that this file itself gates (currently: rotating
 * HyperAgent/Hermes Supabase Auth passwords via the Admin API). Never used
 * for ordinary reads/writes — those go through bridge-server.ts so RLS
 * stays the source of truth.
 *
 * Requires NEXT_PUBLIC_BRIDGE_SUPABASE_URL and BRIDGE_SUPABASE_SERVICE_ROLE_KEY
 * (server-only secret; never exposed to the client, never logged).
 */
export function createBridgeAdminClient() {
  const url = process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_URL;
  const serviceRoleKey = process.env.BRIDGE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Bridge HQ admin client unavailable: set NEXT_PUBLIC_BRIDGE_SUPABASE_URL and BRIDGE_SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

import "server-only";
import { createBridgeServerClient } from "@/lib/supabase/bridge-server";
import type { HqRole } from "@/lib/data/types";

export interface HqProfile {
  id: string;
  displayName: string;
  role: HqRole;
  email: string | null;
}

/**
 * Resolves the signed-in Bridge HQ user and their role, or null if there is
 * no session. Used by the (app) layout to gate the dashboard and by pages
 * that need to know who's acting (e.g. recording a decision).
 */
export async function getCurrentProfile(): Promise<HqProfile | null> {
  const supabase = await createBridgeServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", userData.user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    displayName: profile.display_name,
    role: profile.role,
    email: userData.user.email ?? null,
  };
}

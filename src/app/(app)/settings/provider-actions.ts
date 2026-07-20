"use server";

import { revalidatePath } from "next/cache";
import { createBridgeServerClient } from "@/lib/supabase/bridge-server";
import { getCurrentProfile } from "@/lib/auth/session";
import { getProvider } from "@/lib/ai-providers";
import type { ProviderId } from "@/lib/ai-providers";

/**
 * Mission #005A — AI Provider Credential Manager (status only). Checks that
 * a provider's key (a Vercel env var) actually authenticates, and stores
 * only the *result* (healthy/model/timestamp) — never the key itself.
 */
export async function checkProviderConnection(providerId: ProviderId): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "ceo" && profile.role !== "cto")) {
    throw new Error("Only CEO or CTO can check a provider connection.");
  }

  const provider = getProvider(providerId);
  const result = await provider.verify();

  const supabase = await createBridgeServerClient();
  await supabase.from("ai_provider_checks").upsert({
    provider_id: providerId,
    active_model: provider.defaultModel,
    healthy: result.ok,
    last_error: result.error ?? null,
    checked_by: profile.id,
    checked_at: new Date().toISOString(),
  });

  revalidatePath("/settings");
}

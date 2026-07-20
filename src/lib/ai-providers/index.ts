import "server-only";
import { openaiProvider } from "./openai";
import { geminiProvider } from "./gemini";
import { kimiProvider } from "./kimi";
import type { AIProvider, ProviderId, ProviderStatus } from "./types";

export * from "./types";

const registry: Record<ProviderId, AIProvider> = {
  openai: openaiProvider,
  gemini: geminiProvider,
  kimi: kimiProvider,
};

export function getProvider(id: ProviderId): AIProvider {
  return registry[id];
}

export function listProviders(): AIProvider[] {
  return Object.values(registry);
}

/** Status derived purely from env var presence — no network call, no cost. */
export function listProviderStatuses(): ProviderStatus[] {
  return listProviders().map((p) => ({
    id: p.id,
    label: p.label,
    envVar: p.envVar,
    configured: p.isConfigured(),
    activeModel: p.defaultModel,
  }));
}

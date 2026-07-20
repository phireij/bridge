/**
 * Unified AI provider interface (Mission #005A).
 *
 * The point of this file: swapping which model powers the Bridge CTO Agent
 * (or adding a CMO agent on a different provider later) never means
 * redesigning Bridge — only implementing this interface for the new
 * provider and registering it in `index.ts`.
 *
 * Security rule, non-negotiable: an API key is read from its env var inside
 * a provider's own module and used only in the server-side fetch call that
 * needs it. It is never returned from any function here, never logged,
 * never written to Supabase, and never sent to the client. `ProviderStatus`
 * intentionally has no field that could hold a key or key fragment.
 */

export type ProviderId = "openai" | "gemini" | "kimi";

export interface ProviderStatus {
  id: ProviderId;
  label: string;
  envVar: string;
  configured: boolean;
  activeModel: string;
}

export interface ProviderCheckResult {
  ok: boolean;
  error?: string;
}

export interface CompletionRequest {
  system?: string;
  prompt: string;
  maxOutputTokens?: number;
}

export interface CompletionResult {
  text: string;
  provider: ProviderId;
  model: string;
  /** Rough cost estimate for display only — never a billing source of truth. */
  estimatedCostUsd: number | null;
  usage: { inputTokens: number; outputTokens: number } | null;
}

export interface AIProvider {
  id: ProviderId;
  label: string;
  /** Name of the env var this provider reads its key from, for display only. */
  envVar: string;
  defaultModel: string;
  isConfigured(): boolean;
  /** Lightweight, ideally free/near-free call to confirm the key actually works. */
  verify(): Promise<ProviderCheckResult>;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}

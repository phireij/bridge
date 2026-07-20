import "server-only";
import type { AIProvider, CompletionRequest, CompletionResult, ProviderCheckResult } from "./types";

const ENV_VAR = "GEMINI_API_KEY";
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

/**
 * Stub for Mission #005A — the CMO Agent (which would use this provider) is
 * explicitly out of MVP scope. Wired into the same unified interface now so
 * adding the CMO Agent later never means touching the provider registry or
 * any calling code, only implementing the two methods below for real.
 */
export const geminiProvider: AIProvider = {
  id: "gemini",
  label: "Gemini",
  envVar: ENV_VAR,
  defaultModel: DEFAULT_MODEL,

  isConfigured() {
    return Boolean(process.env[ENV_VAR]);
  },

  async verify(): Promise<ProviderCheckResult> {
    if (!process.env[ENV_VAR]) return { ok: false, error: `${ENV_VAR} is not set.` };
    return { ok: false, error: "Gemini provider not yet implemented (CMO Agent is out of Mission #005A MVP scope)." };
  },

  async complete(_req: CompletionRequest): Promise<CompletionResult> {
    throw new Error("Gemini provider not yet implemented — out of Mission #005A MVP scope.");
  },
};

import "server-only";
import type { AIProvider, CompletionRequest, CompletionResult, ProviderCheckResult } from "./types";

const ENV_VAR = "KIMI_API_KEY";
const DEFAULT_MODEL = process.env.KIMI_MODEL || "moonshot-v1-8k";

/** Stub — no Bridge agent uses Kimi yet. See gemini.ts for the rationale. */
export const kimiProvider: AIProvider = {
  id: "kimi",
  label: "Kimi",
  envVar: ENV_VAR,
  defaultModel: DEFAULT_MODEL,

  isConfigured() {
    return Boolean(process.env[ENV_VAR]);
  },

  async verify(): Promise<ProviderCheckResult> {
    if (!process.env[ENV_VAR]) return { ok: false, error: `${ENV_VAR} is not set.` };
    return { ok: false, error: "Kimi provider not yet implemented — no Bridge agent uses it yet." };
  },

  async complete(_req: CompletionRequest): Promise<CompletionResult> {
    throw new Error("Kimi provider not yet implemented.");
  },
};

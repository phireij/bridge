import "server-only";
import type { AIProvider, CompletionRequest, CompletionResult, ProviderCheckResult } from "./types";

const ENV_VAR = "OPENAI_API_KEY";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

// Rough public per-1K-token pricing for the default model tier, for display
// estimates only — never used for real billing decisions.
const EST_INPUT_PER_1K = 0.0004;
const EST_OUTPUT_PER_1K = 0.0016;

function apiKey(): string | undefined {
  return process.env[ENV_VAR];
}

export const openaiProvider: AIProvider = {
  id: "openai",
  label: "OpenAI",
  envVar: ENV_VAR,
  defaultModel: DEFAULT_MODEL,

  isConfigured() {
    return Boolean(apiKey());
  },

  async verify(): Promise<ProviderCheckResult> {
    const key = apiKey();
    if (!key) return { ok: false, error: `${ENV_VAR} is not set.` };

    try {
      // GET /v1/models is a lightweight, effectively free call — good enough
      // to confirm the key authenticates without spending completion tokens.
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      if (!res.ok) {
        return { ok: false, error: `OpenAI responded ${res.status}.` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Network error." };
    }
  },

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const key = apiKey();
    if (!key) {
      throw new Error(`${ENV_VAR} is not set — Bridge CTO Agent is unavailable on this environment.`);
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          ...(req.system ? [{ role: "system", content: req.system }] : []),
          { role: "user", content: req.prompt },
        ],
        max_tokens: req.maxOutputTokens ?? 700,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenAI request failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;
    const estimatedCostUsd =
      (inputTokens / 1000) * EST_INPUT_PER_1K + (outputTokens / 1000) * EST_OUTPUT_PER_1K;

    return {
      text,
      provider: "openai",
      model: DEFAULT_MODEL,
      estimatedCostUsd,
      usage: { inputTokens, outputTokens },
    };
  },
};

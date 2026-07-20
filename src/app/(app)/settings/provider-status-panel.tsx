"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { checkProviderConnection } from "./provider-actions";
import type { ProviderId, ProviderStatus } from "@/lib/ai-providers";
import type { AiProviderCheckRecord } from "@/lib/data/types";

/**
 * Mission #005A — AI Provider Credential Manager UI. Deliberately has no
 * key-entry field anywhere: keys live only as Vercel environment variables
 * (OPENAI_API_KEY, GEMINI_API_KEY, KIMI_API_KEY). This panel only ever
 * shows configured/missing, the active model, and the result of an
 * on-demand connection check — never a key value.
 */
export function ProviderStatusPanel({
  statuses,
  checks,
}: {
  statuses: ProviderStatus[];
  checks: AiProviderCheckRecord[];
}) {
  const [pending, startTransition] = useTransition();
  const [checkingId, setCheckingId] = useState<ProviderId | null>(null);
  const router = useRouter();

  function handleCheck(id: ProviderId) {
    setCheckingId(id);
    startTransition(async () => {
      await checkProviderConnection(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {statuses.map((status) => {
        const check = checks.find((c) => c.providerId === status.id);
        const isChecking = pending && checkingId === status.id;
        return (
          <div key={status.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <p className="w-20 shrink-0 text-sm font-medium">{status.label}</p>
            <Badge
              variant="outline"
              className={`text-[10px] uppercase ${
                status.configured
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {status.configured ? "Configured" : "Missing"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {status.envVar} · model: {status.activeModel}
            </span>
            {check ? (
              <span
                className={`text-xs ${check.healthy ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
              >
                Last check: {check.healthy ? "OK" : check.lastError ?? "failed"} ·{" "}
                {new Date(check.checkedAt).toLocaleString()}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Never checked</span>
            )}
            <Button
              size="xs"
              variant="outline"
              className="ml-auto"
              disabled={!status.configured || isChecking}
              onClick={() => handleCheck(status.id)}
            >
              {isChecking ? "Checking…" : "Check now"}
            </Button>
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground">
        To add or rotate a key, set the matching environment variable in Vercel → Project Settings →
        Environments → Production (and Preview, if agents should have it there too), then redeploy.
        Bridge never asks for a key here.
      </p>
    </div>
  );
}

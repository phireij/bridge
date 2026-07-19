"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { rotateAgentCredential } from "./credentials-actions";
import type { RotatableAgent } from "./credentials-types";

const LABEL: Record<RotatableAgent, string> = {
  hyperagent: "HyperAgent",
  hermes: "Hermes",
};

function AgentRotateRow({ agent }: { agent: RotatableAgent }) {
  const [pending, startTransition] = useTransition();
  const [reveal, setReveal] = useState<{ password: string; rotatedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleRotate() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      try {
        const result = await rotateAgentCredential(agent);
        setReveal(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Rotation failed.");
      }
    });
  }

  async function handleCopy() {
    if (!reveal) return;
    await navigator.clipboard.writeText(reveal.password);
    setCopied(true);
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{LABEL[agent]}</p>
          <p className="text-xs text-muted-foreground">
            {reveal
              ? `Rotated just now — shown once below.`
              : "Rotate this agent's Supabase Auth password."}
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={pending} onClick={handleRotate}>
          {pending ? "Rotating…" : "Rotate credential"}
        </Button>
      </div>

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      {reveal ? (
        <div className="mt-3 space-y-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Shown once — copy it now and hand it to whatever authenticates as{" "}
            {LABEL[agent]} next. It is not stored anywhere in Bridge.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
              {reveal.password}
            </code>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CredentialsPanel() {
  return (
    <div className="space-y-3">
      <AgentRotateRow agent="hyperagent" />
      <AgentRotateRow agent="hermes" />
      <p className="text-[11px] text-muted-foreground">
        Policy: rotate every 90 days, or immediately on suspected compromise. Every
        rotation is logged (who, which agent, when) in the audit trail — never the
        password itself.
      </p>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { retryMessageBusEvent } from "./actions";
import type { MessageBusEventRecord } from "@/lib/data/types";

const STATUS_BADGE: Record<MessageBusEventRecord["status"], string> = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  delivered: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  retrying: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

/**
 * The AI Message Bus activity feed (Mission #005A) — the complete
 * history/audit trail/retry/status requirements read straight off
 * message_bus_events, no separate log system.
 */
export function MessageBusFeed({ events }: { events: MessageBusEventRecord[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRetry(id: string) {
    startTransition(async () => {
      await retryMessageBusEvent(id);
      router.refresh();
    });
  }

  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground">No Message Bus activity yet.</p>;
  }

  return (
    <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
      {events.map((e) => (
        <div key={e.id} className="rounded-lg border p-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px]">
              {e.fromActor} → {e.toActor}
            </span>
            <Badge variant="outline" className={`text-[10px] uppercase ${STATUS_BADGE[e.status]}`}>
              {e.status}
            </Badge>
            <span className="text-[10px] uppercase text-muted-foreground">{e.messageType}</span>
            <span className="ml-auto text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
          </div>
          <p className="mt-1">{e.summary}</p>
          {e.lastError ? <p className="mt-1 text-rose-600 dark:text-rose-400">{e.lastError}</p> : null}
          {(e.status === "failed" || e.status === "retrying") && e.retryCount < 3 ? (
            <Button size="xs" variant="outline" className="mt-1.5" disabled={pending} onClick={() => handleRetry(e.id)}>
              Retry ({e.retryCount}/3)
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

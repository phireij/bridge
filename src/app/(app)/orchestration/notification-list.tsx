"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markNotificationRead } from "./actions";
import type { NotificationRecord } from "@/lib/data/types";

/** The Notification Center (Mission #005A) — populated at each Message Bus milestone. */
export function NotificationList({ notifications }: { notifications: NotificationRecord[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return <p className="text-xs text-muted-foreground">No notifications yet.</p>;
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 rounded-lg border p-3 text-xs ${!n.readAt ? "border-l-2 border-l-sky-500" : ""}`}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{n.title}</p>
            <p className="mt-0.5 text-muted-foreground">{n.body}</p>
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              {new Date(n.createdAt).toLocaleString()} · to {n.recipientRole}
            </p>
          </div>
          {!n.readAt ? (
            <Button size="xs" variant="ghost" disabled={pending} onClick={() => handleMarkRead(n.id)}>
              Mark read
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

import { Inbox } from "lucide-react";

import { getInbox, getUnreadInboxCount } from "@/lib/data";
import { cn } from "@/lib/utils";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { INBOX_KIND } from "@/lib/inbox-visuals";

export async function InboxPreviewWidget() {
  const [items, unread] = await Promise.all([getInbox(), getUnreadInboxCount()]);

  return (
    <WidgetCard
      title="CEO Inbox"
      icon={Inbox}
      href="/inbox"
      action={
        unread > 0 ? (
          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            {unread} unread
          </span>
        ) : null
      }
      contentClassName="p-0"
    >
      <ul className="divide-y">
        {items.slice(0, 4).map((item) => {
          const meta = INBOX_KIND[item.kind];
          return (
            <li key={item.id} className="flex items-start gap-3 px-5 py-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  meta.className,
                )}
              >
                <meta.icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {item.unread ? (
                    <span className="size-1.5 shrink-0 rounded-full bg-rose-500" />
                  ) : null}
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                    {item.time}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.from}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </WidgetCard>
  );
}

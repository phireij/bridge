import {
  Bell,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { InboxKind } from "@/lib/data/types";

/** Icon + label + tint for each kind of inbox item. Shared by the homepage
 *  widget and the full CEO Inbox page so they never drift apart. */
export const INBOX_KIND: Record<
  InboxKind,
  { icon: LucideIcon; label: string; className: string }
> = {
  approval: {
    icon: ShieldCheck,
    label: "Approval",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  recommendation: {
    icon: Sparkles,
    label: "Recommendation",
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  message: {
    icon: MessageSquare,
    label: "Message",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  notification: {
    icon: Bell,
    label: "Notification",
    className: "bg-muted text-muted-foreground",
  },
};

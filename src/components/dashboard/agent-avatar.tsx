import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { toneFor, TONE_CLASSES } from "@/lib/status";
import type { AgentAccent, AgentStatus } from "@/lib/data/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const AGENT_ACCENT: Record<AgentAccent, string> = {
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
};

export function AgentAvatar({
  name,
  accent,
  status,
  className,
}: {
  name: string;
  accent: AgentAccent;
  status?: AgentStatus;
  className?: string;
}) {
  return (
    <span className="relative inline-flex">
      <Avatar className={cn("size-9 rounded-xl", className)}>
        <AvatarFallback
          className={cn("rounded-xl text-xs font-semibold", AGENT_ACCENT[accent])}
        >
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {status ? (
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card",
            TONE_CLASSES[toneFor(status)].dot,
          )}
        />
      ) : null}
    </span>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

import { navItemFor } from "@/config/nav";
import { site } from "@/config/site";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function useTokyoClock() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function TopBar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  const section = navItemFor(pathname);
  const now = useTokyoClock();

  const time = now
    ? new Intl.DateTimeFormat(site.locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: site.timezone,
      }).format(now)
    : "";
  const day = now
    ? new Intl.DateTimeFormat(site.locale, {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: site.timezone,
      }).format(now)
    : "";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="text-muted-foreground" />
      <Separator orientation="vertical" className="mr-1 h-5!" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold leading-none">
          {section?.title ?? site.name}
        </span>
        <span className="mt-1 hidden truncate text-xs text-muted-foreground sm:block">
          {section?.description ?? site.description}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="hidden items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground lg:flex">
          <Search className="size-3.5" />
          <span>Search</span>
          <kbd className="rounded border bg-background px-1 font-mono text-[10px]">
            ⌘K
          </kbd>
        </div>

        <div className="hidden text-right leading-tight sm:block">
          <div className="font-mono text-sm tabular-nums">{time || "--:--"}</div>
          <div className="text-[11px] text-muted-foreground">
            {day || "—"} · JST
          </div>
        </div>

        <Separator orientation="vertical" className="mx-0.5 h-5!" />

        <Button
          asChild
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
        >
          <Link href="/inbox" aria-label={`CEO Inbox, ${unreadCount} unread`}>
            <Bell className="size-4" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            ) : null}
          </Link>
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
}

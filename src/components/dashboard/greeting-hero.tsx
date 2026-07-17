"use client";

import * as React from "react";

import { site } from "@/config/site";

export interface GreetingStat {
  label: string;
  value: string;
}

export function GreetingHero({
  greeting,
  dateLabel,
  subtitle,
  stats,
}: {
  greeting: string;
  dateLabel: string;
  subtitle: string;
  stats: GreetingStat[];
}) {
  const [time, setTime] = React.useState<string>("");

  React.useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat(site.locale, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: site.timezone,
        }).format(new Date()),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-xl border bg-card p-6 sm:p-8">
      {/* soft accent wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/5 blur-3xl"
      />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium tracking-wide text-foreground/70 uppercase">
            {site.company} · {site.short}
          </span>
          <span className="text-muted-foreground/50">•</span>
          <span>{dateLabel}</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="font-mono tabular-nums">
            {time || "--:--:--"} JST
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting}, {site.ceo.name}.
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-baseline gap-1.5 rounded-lg border bg-background/60 px-3 py-1.5"
            >
              <span className="text-sm font-semibold tabular-nums">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

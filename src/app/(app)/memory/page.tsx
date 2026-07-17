import type { Metadata } from "next";
import { Building2, Sparkles, Target } from "lucide-react";

import { getCompany, getCompanyValues, getDecisions } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Company Memory" };

const IMPACT_BADGE = {
  high: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "bg-muted text-muted-foreground",
  low: "bg-muted text-muted-foreground",
} as const;

export default async function MemoryPage() {
  const [company, values, decisions] = await Promise.all([
    getCompany(),
    getCompanyValues(),
    getDecisions(),
  ]);

  const facts = [
    { label: "Founded", value: company.founded },
    { label: "Headquarters", value: company.hq },
    { label: "Stage", value: company.stage },
    { label: "Time zone", value: company.timezone },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${company.name} · Est. ${company.founded}`}
        title="Company Memory"
        description="Who we are, where we're going, and the decisions that got us here."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Target className="size-4" />
              </span>
              Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/90">
              {company.mission}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Sparkles className="size-4" />
              </span>
              Vision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/90">
              {company.vision}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label}>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="size-3.5" /> {fact.label}
              </p>
              <p className="mt-1 text-sm font-medium">{fact.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Operating principles
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => (
            <Card key={value.title} className="gap-0 p-5">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold">{value.title}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {value.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Decision Log</CardTitle>
          <CardDescription>
            The choices that shaped the company, most recent first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-5 border-l pl-6">
            {decisions.map((d) => (
              <li key={d.id} className="relative">
                <span className="absolute top-1 -left-[1.7rem] size-3 rounded-full border-2 border-card bg-primary/60" />
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{d.title}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {d.category}
                  </Badge>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                      IMPACT_BADGE[d.impact],
                    )}
                  >
                    {d.impact} impact
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {d.date}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{d.summary}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  Decided by {d.owner}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

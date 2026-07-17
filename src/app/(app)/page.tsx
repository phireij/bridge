import {
  getAgents,
  getPriorities,
  getSprint,
  getUnreadInboxCount,
} from "@/lib/data";
import { site } from "@/config/site";
import { greetingFor } from "@/lib/format";
import { GreetingHero } from "@/components/dashboard/greeting-hero";
import { PrioritiesWidget } from "@/components/dashboard/priorities-widget";
import { CompanyHealthWidget } from "@/components/dashboard/company-health-widget";
import { CurrentSprintWidget } from "@/components/dashboard/current-sprint-widget";
import { WorkforceStatusWidget } from "@/components/dashboard/workforce-status-widget";
import { InboxPreviewWidget } from "@/components/dashboard/inbox-preview-widget";
import { RecentDecisionsWidget } from "@/components/dashboard/recent-decisions-widget";
import { UpcomingMilestonesWidget } from "@/components/dashboard/upcoming-milestones-widget";

export default async function HeadquartersPage() {
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: site.timezone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  const dateLabel = new Intl.DateTimeFormat(site.locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: site.timezone,
  }).format(now);

  const [priorities, unread, sprint, agents] = await Promise.all([
    getPriorities(),
    getUnreadInboxCount(),
    getSprint(),
    getAgents(),
  ]);

  const openPriorities = priorities.filter((p) => p.state !== "done").length;
  const activeAgents = agents.filter((a) => a.status === "active").length;

  const subtitle = `You have ${unread} items in your inbox and ${openPriorities} priorities today. ${activeAgents} agents are on the clock and Sprint 7 is ${sprint.progress}% done.`;

  return (
    <div className="space-y-4">
      <GreetingHero
        greeting={greetingFor(hour)}
        dateLabel={dateLabel}
        subtitle={subtitle}
        stats={[
          { value: String(unread), label: "inbox" },
          { value: String(openPriorities), label: "priorities" },
          { value: `${sprint.progress}%`, label: "sprint" },
          { value: String(activeAgents), label: "agents live" },
        ]}
      />

      <CompanyHealthWidget />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PrioritiesWidget />
        <CurrentSprintWidget />
        <WorkforceStatusWidget />
        <InboxPreviewWidget />
        <RecentDecisionsWidget />
        <UpcomingMilestonesWidget />
      </div>
    </div>
  );
}

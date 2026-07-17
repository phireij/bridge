import { Bot } from "lucide-react";

import { getAgents } from "@/lib/data";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { AgentAvatar } from "@/components/dashboard/agent-avatar";
import { StatusBadge } from "@/components/shared/status-badge";

export async function WorkforceStatusWidget() {
  const agents = await getAgents();
  const active = agents.filter((a) => a.status === "active").length;

  return (
    <WidgetCard
      title="AI Workforce"
      icon={Bot}
      href="/workforce"
      action={
        <span className="text-xs text-muted-foreground">
          {active} active · {agents.length} total
        </span>
      }
      contentClassName="p-0"
    >
      <ul className="divide-y">
        {agents.map((agent) => (
          <li key={agent.id} className="flex items-center gap-3 px-5 py-3">
            <AgentAvatar
              name={agent.name}
              accent={agent.accent}
              status={agent.status}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{agent.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {agent.role}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={agent.status} />
              <span className="text-[11px] text-muted-foreground">
                {agent.status === "active"
                  ? `${agent.tasksInQueue} in queue`
                  : agent.lastActive}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}

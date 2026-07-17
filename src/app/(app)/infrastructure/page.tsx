import type { Metadata } from "next";
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import { getServices, getVpsResources } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge, StatusDot } from "@/components/shared/status-badge";

export const metadata: Metadata = { title: "Infrastructure" };

const GAUGE_ICON: Record<string, LucideIcon> = {
  CPU: Cpu,
  Memory: MemoryStick,
  Disk: HardDrive,
  Bandwidth: Wifi,
};

export default async function InfrastructurePage() {
  const [services, vps] = await Promise.all([getServices(), getVpsResources()]);
  const online = services.filter((s) => s.status === "online").length;
  const cpu = vps.find((g) => g.label === "CPU")?.percent ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Systems"
        title="Infrastructure"
        description="The servers, services, and pipelines the company runs on — with live health at a glance."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Services Online" value={`${online} / ${services.length}`} hint="1 in mock" />
        <StatCard label="Overall Uptime" value="99.9%" change="30-day" trend="up" hint="weighted" />
        <StatCard label="Open Incidents" value="1" hint="monitoring" />
        <StatCard label="VPS Load" value={`${cpu}%`} hint="CPU · primary node" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Primary VPS</CardTitle>
            <CardDescription>Hostinger KVM 2 · Tokyo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vps.map((gauge) => {
              const Icon = GAUGE_ICON[gauge.label] ?? Cpu;
              return (
                <div key={gauge.label} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="font-medium">{gauge.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {gauge.used} / {gauge.total} {gauge.unit}
                    </span>
                  </div>
                  <Progress value={gauge.percent} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>Connectivity and uptime across the stack.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="flex flex-wrap items-center gap-3 px-6 py-3.5"
                >
                  <StatusDot
                    status={service.status}
                    pulse={service.status === "online"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{service.name}</p>
                      {service.region ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {service.region}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {service.category} · {service.detail}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {service.uptime}
                    </span>
                    <StatusBadge status={service.status} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

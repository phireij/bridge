import type { Metadata } from "next";

import { getCompany } from "@/lib/data";
import { getCurrentProfile } from "@/lib/auth/session";
import { site } from "@/config/site";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { AppearanceControl } from "@/components/settings/appearance";
import { CredentialsPanel } from "./credentials-panel";

export const metadata: Metadata = { title: "Settings" };

type IntegrationState = "connected" | "mock" | "not_connected";

const integrations: { name: string; detail: string; state: IntegrationState }[] = [
  { name: "GitHub", detail: "Source control · PR #3 in review", state: "connected" },
  { name: "Supabase (bridge-hq)", detail: "Bridge Lite HQ — live", state: "connected" },
  { name: "Supabase (ruby-reservations)", detail: "Reservations — live", state: "connected" },
  { name: "Komoju", detail: "Primary payments · JP", state: "connected" },
  { name: "Vercel", detail: "Bridge hosting", state: "connected" },
  { name: "Yamato Cold-Chain", detail: "Nationwide delivery", state: "connected" },
  { name: "Hostinger VPS", detail: "Storefront + WordPress", state: "connected" },
  { name: "Stripe", detail: "Secondary payments", state: "not_connected" },
  { name: "Slack", detail: "Team notifications", state: "not_connected" },
];

function IntegrationBadge({ state }: { state: IntegrationState }) {
  if (state === "connected")
    return <StatusBadge status="online" label="Connected" />;
  if (state === "mock") return <StatusBadge status="degraded" label="Mock" />;
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Not connected
    </Badge>
  );
}

export default async function SettingsPage() {
  const [company, profile] = await Promise.all([getCompany(), getCurrentProfile()]);

  const profileFields = [
    { label: "Name", value: profile?.displayName ?? site.ceo.name },
    { label: "Role", value: profile?.role ?? site.ceo.title },
    { label: "Headquarters", value: company.hq },
    { label: "Time zone", value: company.timezone },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Your profile, how Bridge looks, and the services it connects to."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>How you appear across the headquarters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-14 rounded-xl">
                <AvatarFallback className="rounded-xl bg-primary text-lg text-primary-foreground">
                  {site.ceo.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold">{profile?.displayName ?? site.ceo.name}</p>
                <p className="text-sm text-muted-foreground">
                  {site.ceo.title} · {company.name}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              {profileFields.map((field) => (
                <div key={field.label}>
                  <dt className="text-xs text-muted-foreground">{field.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{field.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Bridge defaults to dark. Choose what suits your mornings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppearanceControl />
          </CardContent>
        </Card>
      </div>

      {profile?.role === "ceo" ? (
        <Card>
          <CardHeader>
            <CardTitle>Agent Credentials</CardTitle>
            <CardDescription>
              Rotate HyperAgent's and Hermes' Supabase Auth passwords. Shown once on
              rotation, never stored — only the rotation event itself is audited.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CredentialsPanel />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Services connected to the company.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {integrations.map((integration) => (
              <li
                key={integration.name}
                className="flex items-center gap-3 px-6 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{integration.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {integration.detail}
                  </p>
                </div>
                <IntegrationBadge state={integration.state} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Bridge</CardTitle>
          <CardDescription>The company&apos;s digital headquarters.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Version</p>
            <p className="mt-0.5 text-sm font-medium">v{site.version}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Company</p>
            <p className="mt-0.5 text-sm font-medium">{company.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Stack</p>
            <p className="mt-0.5 text-sm font-medium">Next.js · shadcn/ui</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Data source</p>
            <p className="mt-0.5 text-sm font-medium">Live (bridge-hq)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

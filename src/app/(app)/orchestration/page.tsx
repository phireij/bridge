import type { Metadata } from "next";

import {
  getCeoRequests,
  getCtoProposalsByRequest,
  getMessageBusEvents,
  getNotifications,
} from "@/lib/data";
import { getCurrentProfile } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { RequestForm } from "./request-form";
import { ProposalCard } from "./proposal-card";
import { MessageBusFeed } from "./message-bus-feed";
import { NotificationList } from "./notification-list";

export const metadata: Metadata = { title: "Orchestration" };

/**
 * Mission #005A — Bridge Core Orchestration (MVP slice).
 *
 * This page is the CEO Dashboard + Notification Center the mission asks
 * for, combined into one decision-focused surface rather than two nav
 * items, per the CEO directive to avoid unnecessary sprawl. The Executive
 * Assistant and Bridge CTO Agent aren't separate UI surfaces — they're the
 * server actions behind Submit / Approve / Reject below.
 */
export default async function OrchestrationPage() {
  const [profile, requests, notifications, allBusEvents] = await Promise.all([
    getCurrentProfile(),
    getCeoRequests(),
    getNotifications(),
    getMessageBusEvents(),
  ]);

  const proposalsByRequest = await Promise.all(
    requests.map(async (r) => ({ request: r, proposals: await getCtoProposalsByRequest(r.id) })),
  );

  const isCeo = profile?.role === "ceo";
  const pendingApproval = requests.filter((r) => r.status === "proposed").length;
  const delegated = requests.filter((r) => ["delegated", "in_progress"].includes(r.status)).length;
  const unreadNotifications = notifications.filter((n) => !n.readAt).length;
  const failedMessages = allBusEvents.filter((e) => e.status === "failed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bridge Core Orchestration"
        title="Orchestration"
        description="Submit a request, get a Bridge CTO Agent proposal, approve it, and the Executive Assistant delegates the rest — no manual relay between ChatGPT, HyperAgent, and Hermes."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Awaiting your approval" value={String(pendingApproval)} hint="proposals ready" />
        <StatCard label="Delegated / in progress" value={String(delegated)} hint="active work" />
        <StatCard label="Unread notifications" value={String(unreadNotifications)} hint="Notification Center" />
        <StatCard label="Failed Message Bus events" value={String(failedMessages)} hint="need a retry" />
      </div>

      {isCeo ? (
        <Card>
          <CardHeader>
            <CardTitle>Submit a request</CardTitle>
            <CardDescription>
              The Bridge CTO Agent analyzes it automatically and comes back with a proposal below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestForm />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Requests &amp; proposals</CardTitle>
          <CardDescription>Every request, its Bridge CTO Agent proposal, and its status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requests">
            <TabsList>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="bus">Message Bus</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-3 pt-4">
              {proposalsByRequest.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No requests yet. {isCeo ? "Submit one above." : "Only the CEO can submit a request."}
                </p>
              ) : (
                proposalsByRequest.map(({ request, proposals }) => (
                  <ProposalCard key={request.id} request={request} proposal={proposals[0] ?? null} isCeo={isCeo} />
                ))
              )}
            </TabsContent>

            <TabsContent value="bus" className="pt-4">
              <MessageBusFeed events={allBusEvents} />
            </TabsContent>

            <TabsContent value="notifications" className="pt-4">
              <NotificationList notifications={notifications} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

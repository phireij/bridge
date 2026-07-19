import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { submitReportAction } from "./actions";

export const metadata: Metadata = { title: "Submit Report" };

export default function NewReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Report intake"
        title="Submit a report"
        description="Manual fallback for HyperAgent / Hermes report intake — the same submission an agent's own API call makes lands in the CEO Inbox this way too."
      />
      <Card>
        <CardContent className="pt-6">
          <form action={submitReportAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agent">Agent</Label>
                {/* Plain native <select> on purpose: it posts its value via
                    FormData automatically for this Server Action form. The
                    Radix-based Select component doesn't render a native form
                    control, so it silently submitted nothing here. */}
                <select
                  id="agent"
                  name="agent"
                  defaultValue="hyperagent"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="hyperagent">HyperAgent</option>
                  <option value="hermes">Hermes</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="missionCode">Mission code (optional)</Label>
                <Input id="missionCode" name="missionCode" placeholder="002A" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea id="summary" name="summary" required className="min-h-20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence</Label>
              <Textarea id="evidence" name="evidence" className="min-h-16" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risks">Risks</Label>
              <Textarea id="risks" name="risks" className="min-h-16" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendation">Recommendation</Label>
              <Textarea id="recommendation" name="recommendation" className="min-h-16" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedDecision">Requested decision</Label>
              <Input id="requestedDecision" name="requestedDecision" placeholder="Approve Friday go-live" />
            </div>
            <Button type="submit">Submit report</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

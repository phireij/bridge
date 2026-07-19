import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
                <Select name="agent" defaultValue="hyperagent">
                  <SelectTrigger id="agent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hyperagent">HyperAgent</SelectItem>
                    <SelectItem value="hermes">Hermes</SelectItem>
                  </SelectContent>
                </Select>
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

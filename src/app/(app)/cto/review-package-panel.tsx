"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateReviewPackage, requestCtoReview } from "./review-actions";

/**
 * Mission #004A — CTO Review Package + Pre-Review Gate.
 *
 * "One button" that compiles the mission into a Markdown package complete
 * enough to paste into ChatGPT without extra explanation, plus a second
 * button that requests CTO review — which the server action blocks if the
 * Pre-Review Gate isn't satisfied (tests, rollback plan, security review,
 * migration notes, Hermes verdict).
 */
export function ReviewPackagePanel({ missionId }: { missionId: string }) {
  const [pending, startTransition] = useTransition();
  const [requesting, startRequestTransition] = useTransition();
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);
  const [requested, setRequested] = useState(false);
  const router = useRouter();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const md = await generateReviewPackage(missionId);
        setMarkdown(md);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate the CTO Review Package.");
      }
    });
  }

  function handleRequestReview() {
    setError(null);
    setGateMissing(null);
    startRequestTransition(async () => {
      try {
        const result = await requestCtoReview(missionId);
        if (!result.requested) {
          setGateMissing(result.missing);
        } else {
          setRequested(true);
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to request CTO review.");
      }
    });
  }

  function handleCopy() {
    if (markdown) navigator.clipboard.writeText(markdown);
  }

  function handleDownload() {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cto-review-package-${missionId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={pending} onClick={handleGenerate}>
          {pending ? "Compiling…" : "Generate CTO Review Package"}
        </Button>
        <Button size="sm" disabled={requesting || requested} onClick={handleRequestReview}>
          {requested ? "Review requested" : requesting ? "Checking gate…" : "Request CTO Review"}
        </Button>
        {markdown ? (
          <>
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              Copy Markdown
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDownload}>
              Download .md
            </Button>
          </>
        ) : null}
      </div>

      {gateMissing && gateMissing.length > 0 ? (
        <p className="text-xs text-destructive">
          Pre-Review Gate blocked the request — missing: {gateMissing.join(", ")}. Log these as mission
          events (test_evidence, rollback_plan, security_review, migration_notes) or a Hermes report
          before requesting again.
        </p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {markdown ? (
        <Textarea readOnly value={markdown} className="h-64 font-mono text-xs" />
      ) : (
        <p className="text-xs text-muted-foreground">
          Generate the package to preview exactly what the CTO will receive — mission report,
          PR/commit references, architecture notes, tests, risks, rollback plan, Hermes certification,
          open questions, and the Recommendation Engine&apos;s verdict, compiled from live data.
        </p>
      )}
    </div>
  );
}

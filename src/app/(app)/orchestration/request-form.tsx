"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitCeoRequest } from "./actions";

/**
 * Mission #005A acceptance criteria, step 1: "The CEO submits a request
 * entirely within Bridge." Submitting also triggers the Bridge CTO Agent's
 * analysis server-side — no second click needed for the common case.
 */
export function RequestForm() {
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitCeoRequest(title, rawText);
        setTitle("");
        setRawText("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit request.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="request-title" className="text-xs">
          Title
        </Label>
        <Input
          id="request-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Launch the anniversary weekend social push"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="request-text" className="text-xs">
          What do you need?
        </Label>
        <Textarea
          id="request-text"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Describe the request in plain language — the Bridge CTO Agent will analyze it and propose a plan."
          className="mt-1 h-28 text-sm"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending || !title.trim() || !rawText.trim()}>
        {pending ? "Submitting…" : "Submit request"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  );
}

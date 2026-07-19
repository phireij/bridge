"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { generateCtoBrief } from "./brief-actions";

export function BriefGeneratorButton({ missionId }: { missionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        await generateCtoBrief(missionId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate brief.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" disabled={pending} onClick={handleGenerate}>
        {pending ? "Generating…" : "Generate CTO Brief"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

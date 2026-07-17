"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Lock } from "lucide-react";

import { signInAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLogin({
  devHint,
  configured = true,
}: {
  devHint: boolean;
  configured?: boolean;
}) {
  const router = useRouter();
  const [passcode, setPasscode] = React.useState("");
  const [error, setError] = React.useState(false);
  const [pending, start] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    start(async () => {
      const r = await signInAction(passcode);
      if (r.ok) router.refresh();
      else setError(true);
    });
  }

  if (!configured) {
    return (
      <div className="mx-auto mt-10 max-w-sm">
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          <p className="font-medium text-foreground">Admin not configured</p>
          <p className="mt-1">
            Set <code className="font-mono">ADMIN_PASSCODE</code> for this deployment to
            enable staff sign-in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Lock className="size-5" />
        </div>
        <h1 className="mt-3 text-lg font-semibold">Staff sign-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the shared staff passcode to manage reservations.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="passcode">Passcode</Label>
            <Input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-rose-500">Incorrect passcode.</p>}
          <Button type="submit" className="w-full" disabled={pending || !passcode}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>
        {devHint && (
          <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
            Dev mode — ADMIN_PASSCODE isn&apos;t set, so the passcode is{" "}
            <code className="font-mono">ruby-dev</code>. Set ADMIN_PASSCODE before launch.
          </p>
        )}
      </div>
    </div>
  );
}

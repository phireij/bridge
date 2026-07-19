import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in — Bridge" };

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Kakehashi
          </p>
          <h1 className="text-xl font-semibold">Bridge</h1>
          <p className="text-sm text-muted-foreground">
            Internal access only — CEO, CTO, HyperAgent, Hermes.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

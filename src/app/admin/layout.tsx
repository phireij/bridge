import type { Metadata } from "next";
import { CakeSlice } from "lucide-react";

export const metadata: Metadata = {
  title: "Reservations Admin · Ruby's Cake Delights",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-rose-500 text-white">
            <CakeSlice className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Reservations Admin</p>
            <p className="text-xs text-muted-foreground">Ruby&apos;s Cake Delights · Anniversary</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

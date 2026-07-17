import type { Metadata } from "next";
import { CakeSlice, Clock, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Reserve · Ruby's Cake Delights",
  description:
    "Reserve your table for Ruby's Cake Delights' anniversary — July 25–26, 2026, in Ichikawa, Chiba.",
};

export default function ReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="light min-h-svh bg-[#fdf5f3] text-neutral-900">
      <header className="border-b border-rose-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-rose-500 text-white">
            <CakeSlice className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Ruby&apos;s Cake Delights</p>
            <p className="text-xs text-rose-600">3rd Anniversary · July 25–26</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 py-6">{children}</main>

      <footer className="mx-auto max-w-lg px-5 pb-10 pt-4 text-xs text-neutral-500">
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5" /> Ichikawa, Chiba · Japan
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Clock className="size-3.5" /> Anniversary hours 10:00–20:00 · 60-minute seatings
        </div>
      </footer>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, LogOut, RefreshCw, UserCheck, UserX } from "lucide-react";

import { setStatusAction, signOutAction } from "@/app/admin/actions";
import { CAPACITY, DATE_LABELS, RESERVATION_DATES, to12h } from "@/lib/reservations/config";
import type {
  Reservation,
  ReservationStatus,
  SlotAvailability,
} from "@/lib/reservations/types";
import type { LastEmailStatus } from "@/lib/email/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STATUS_STYLE: Record<ReservationStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  confirmed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  arrived: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  no_show: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  cancelled: "border-border bg-muted text-muted-foreground",
};
const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  arrived: "Arrived",
  no_show: "No-show",
  cancelled: "Cancelled",
};
const STATUS_FILTERS: (ReservationStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "arrived",
  "no_show",
  "cancelled",
];

export function AdminDashboard({
  reservations,
  availByDate,
  live,
  emailByRes = {},
}: {
  reservations: Reservation[];
  availByDate: Record<string, SlotAvailability[]>;
  live: boolean;
  emailByRes?: Record<string, LastEmailStatus>;
}) {
  const router = useRouter();
  const [dateFilter, setDateFilter] = React.useState<string>(RESERVATION_DATES[0]);
  const [statusFilter, setStatusFilter] = React.useState<ReservationStatus | "all">("all");
  const [pending, start] = React.useTransition();

  const visible = reservations.filter(
    (r) =>
      (dateFilter === "all" || r.reservation_date === dateFilter) &&
      (statusFilter === "all" || r.status === statusFilter),
  );

  const counts = React.useMemo(() => {
    const scope = reservations.filter(
      (r) => dateFilter === "all" || r.reservation_date === dateFilter,
    );
    const by = (s: ReservationStatus) => scope.filter((r) => r.status === s).length;
    return { pending: by("pending"), confirmed: by("confirmed"), total: scope.length };
  }, [reservations, dateFilter]);

  const slots = dateFilter !== "all" ? (availByDate[dateFilter] ?? []) : [];

  function act(id: string, status: ReservationStatus) {
    start(async () => {
      await setStatusAction(id, status);
      router.refresh();
    });
  }
  function signOut() {
    start(async () => {
      await signOutAction();
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">Reservations</h1>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs font-medium",
            live
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
          )}
        >
          {live ? "Live · Supabase" : "Dev · seeded"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.refresh()} disabled={pending}>
            <RefreshCw className={cn("size-4", pending && "animate-spin")} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </div>

      {/* summary */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Stat label="Pending" value={counts.pending} tone="amber" />
        <Stat label="Confirmed" value={counts.confirmed} tone="emerald" />
        <Stat label="Total" value={counts.total} tone="muted" />
      </div>

      {/* filters */}
      <div className="space-y-2">
        <Chips
          options={[{ v: "all", l: "All dates" }, ...RESERVATION_DATES.map((d) => ({ v: d, l: DATE_LABELS[d] }))]}
          value={dateFilter}
          onChange={setDateFilter}
        />
        <Chips
          options={STATUS_FILTERS.map((s) => ({ v: s, l: s === "all" ? "All" : STATUS_LABEL[s] }))}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as ReservationStatus | "all")}
        />
      </div>

      {/* remaining capacity per slot */}
      {dateFilter !== "all" && (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Remaining capacity · {DATE_LABELS[dateFilter]}
          </p>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-10">
            {slots.map((s) => (
              <div
                key={s.start}
                className={cn(
                  "rounded-md border px-1 py-1.5 text-center",
                  s.remaining === 0
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : s.remaining <= 3
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-border",
                )}
              >
                <div className="text-[11px] font-medium">{to12h(s.start)}</div>
                <div className="text-[10px] text-muted-foreground">
                  {s.remaining}/{CAPACITY}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* list */}
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          No reservations match this filter.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((r) => (
            <li key={r.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.customer_name}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        STATUS_STYLE[r.status],
                      )}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {DATE_LABELS[r.reservation_date]} · {to12h(r.start_time)} ·{" "}
                    {r.guests} {r.guests > 1 ? "guests" : "guest"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.phone}
                    {r.email ? ` · ${r.email}` : ""} ·{" "}
                    <span className="font-mono">{r.ref}</span>
                    {r.email && <EmailBadge s={emailByRes[r.id]} />}
                  </p>
                  {r.notes && (
                    <p className="mt-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground/80">
                      {r.notes}
                    </p>
                  )}
                </div>
                <div className="ml-auto flex flex-wrap justify-end gap-1.5">
                  {r.status === "pending" && (
                    <Button size="sm" onClick={() => act(r.id, "confirmed")} disabled={pending}>
                      <Check className="size-4" /> Approve
                    </Button>
                  )}
                  {r.status === "confirmed" && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => act(r.id, "arrived")} disabled={pending}>
                        <UserCheck className="size-4" /> Arrived
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => act(r.id, "no_show")} disabled={pending}>
                        <UserX className="size-4" /> No-show
                      </Button>
                    </>
                  )}
                  {(r.status === "pending" || r.status === "confirmed") && (
                    <Button size="sm" variant="ghost" onClick={() => act(r.id, "cancelled")} disabled={pending}>
                      <Ban className="size-4" /> Cancel
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "emerald" | "muted";
}) {
  const styles = {
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    muted: "text-foreground",
  } as const;
  return (
    <div className="rounded-lg border bg-card px-3 py-1.5">
      <span className={cn("text-base font-semibold tabular-nums", styles[tone])}>{value}</span>{" "}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === o.v
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

const EMAIL_TONE: Record<LastEmailStatus["status"], string> = {
  sent: "text-emerald-600 dark:text-emerald-400",
  failed: "text-rose-600 dark:text-rose-400",
  skipped_blank: "text-muted-foreground",
  no_provider: "text-amber-600 dark:text-amber-400",
};
const EMAIL_LABEL: Record<LastEmailStatus["status"], string> = {
  sent: "✓ sent",
  failed: "! failed",
  skipped_blank: "no email",
  no_provider: "email off",
};

function EmailBadge({ s }: { s?: LastEmailStatus }) {
  if (!s) return null;
  return (
    <span className={cn("ml-1", EMAIL_TONE[s.status])}>
      · email {s.kind} {EMAIL_LABEL[s.status]}
    </span>
  );
}

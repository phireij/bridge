"use client";

import * as React from "react";
import { CircleCheckBig, Clock, LoaderCircle, MapPin, Minus, Plus, Users } from "lucide-react";

import { createBookingAction, getAvailabilityAction } from "@/app/reserve/actions";
import { DATE_LABELS, MAX_PARTY, RESERVATION_DATES, SHOP, SHOP_TEL, to12h } from "@/lib/reservations/config";
import type { BookingResult, SlotAvailability } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-5 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function BookingFlow({
  initial,
  emailEnabled = true,
}: {
  initial: Record<string, SlotAvailability[]>;
  emailEnabled?: boolean;
}) {
  const [avail, setAvail] = React.useState(initial);
  const [date, setDate] = React.useState<string | null>(null);
  const [guests, setGuests] = React.useState(2);
  const [slot, setSlot] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", phone: "", email: "", notes: "" });
  const [consent, setConsent] = React.useState(false);
  const [result, setResult] = React.useState<BookingResult | null>(null);
  const [pending, start] = React.useTransition();

  const slots = date ? (avail[date] ?? []) : [];

  function pickDate(d: string) {
    setDate(d);
    setSlot(null);
    setResult(null);
  }
  function changeGuests(delta: number) {
    setGuests((g) => Math.min(MAX_PARTY, Math.max(1, g + delta)));
    setSlot(null);
  }
  function submit() {
    if (!date || !slot) return;
    start(async () => {
      const r = await createBookingAction({
        date,
        start: slot,
        guests,
        name: form.name,
        phone: form.phone,
        email: emailEnabled ? form.email || undefined : undefined,
        notes: form.notes || undefined,
        consent,
      });
      setResult(r);
      if (!r.ok && r.code === "SLOT_FULL") {
        const fresh = await getAvailabilityAction(date);
        setAvail((p) => ({ ...p, [date]: fresh }));
        setSlot(null);
      }
    });
  }
  function reset() {
    setDate(null);
    setGuests(2);
    setSlot(null);
    setForm({ name: "", phone: "", email: "", notes: "" });
    setConsent(false);
    setResult(null);
  }

  if (result?.ok) {
    const r = result.reservation;
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CircleCheckBig className="size-6" />
        </div>
        <h1 className="mt-3 text-xl font-semibold">Reservation received!</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Your booking is <span className="font-medium">pending confirmation</span>. Our
          team will review it shortly — nothing more to do for now.
        </p>
        <div className="mt-4 rounded-xl bg-rose-50 p-4 text-left text-sm">
          <div className="text-center">
            <p className="text-xs text-neutral-500">Reference</p>
            <p className="font-mono text-lg font-semibold tracking-wide text-rose-700">
              {r.ref}
            </p>
          </div>
          <dl className="mt-3 space-y-1.5 border-t border-rose-100 pt-3">
            <Row label="Date" value={DATE_LABELS[r.reservation_date] ?? r.reservation_date} />
            <Row label="Time" value={`${to12h(r.start_time)} – ${to12h(r.end_time)}`} />
            <Row label="Party" value={`${r.guests} guest${r.guests > 1 ? "s" : ""}`} />
            <Row label="Name" value={r.customer_name} />
          </dl>
        </div>
        <div className="mt-4 space-y-1.5 text-xs text-neutral-500">
          <p>Please arrive on time — seatings are 60 minutes.</p>
          <p>
            Change or cancel? Call{" "}
            <a href={SHOP_TEL} className="font-medium text-rose-600">
              {SHOP.phone}
            </a>{" "}
            with your reference.
          </p>
          <p className="pt-1 leading-relaxed text-neutral-400">
            ご予約は「承認待ち」です。スタッフの確認後に確定します。変更・キャンセルはお電話ください。
          </p>
          <p className="flex items-center justify-center gap-1 pt-1 text-neutral-500">
            <MapPin className="size-3.5 shrink-0" /> {SHOP.addressJa}
          </p>
        </div>
        <Button onClick={reset} variant="outline" className="mt-5 w-full">
          Make another reservation
        </Button>
      </div>
    );
  }

  const canSubmit =
    !!slot && form.name.trim() !== "" && form.phone.trim() !== "" && consent && !pending;

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reserve your table</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Join us for our 3rd anniversary on July 25–26. Choose a time and we&apos;ll save
          your spot.
        </p>
      </div>

      <Section step={1} title="Choose a date">
        <div className="grid grid-cols-2 gap-2">
          {RESERVATION_DATES.map((d) => {
            const [weekday, rest] = DATE_LABELS[d].split(", ");
            return (
              <button
                key={d}
                type="button"
                onClick={() => pickDate(d)}
                aria-pressed={date === d}
                className={cn(
                  "rounded-xl border p-3 text-center transition-colors",
                  date === d
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-neutral-200 hover:border-rose-300",
                )}
              >
                <div className="text-xs text-neutral-500">{weekday}</div>
                <div className="text-sm font-semibold">{rest}</div>
              </button>
            );
          })}
        </div>
      </Section>

      {date && (
        <Section step={2} title="Party size">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-neutral-600">
              <Users className="size-4" /> Guests
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => changeGuests(-1)}
                disabled={guests <= 1}
                className="flex size-9 items-center justify-center rounded-full border border-neutral-200 disabled:opacity-40"
                aria-label="Fewer guests"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-6 text-center text-lg font-semibold tabular-nums">{guests}</span>
              <button
                type="button"
                onClick={() => changeGuests(1)}
                disabled={guests >= MAX_PARTY}
                className="flex size-9 items-center justify-center rounded-full border border-neutral-200 disabled:opacity-40"
                aria-label="More guests"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Up to {MAX_PARTY} guests per reservation.</p>
        </Section>
      )}

      {date && (
        <Section step={3} title="Choose a time">
          <div className="grid grid-cols-3 gap-2">
            {slots.map((s) => {
              const full = s.remaining <= 0;
              const tooBig = !full && s.remaining < guests;
              const disabled = full || tooBig;
              const selected = slot === s.start;
              return (
                <button
                  key={s.start}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSlot(s.start)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-lg border px-1 py-2 text-center transition-colors",
                    selected
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : disabled
                        ? "cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-300"
                        : "border-neutral-200 hover:border-rose-300",
                  )}
                >
                  <div className="text-sm font-medium">{to12h(s.start)}</div>
                  <div className="text-[10px]">
                    {full ? "Full" : `${s.remaining} left`}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
            <Clock className="size-3.5" /> Each seating is 60 minutes.
          </p>
        </Section>
      )}

      {slot && (
        <Section step={4} title="Your details">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="090-1234-5678"
                autoComplete="tel"
              />
            </div>
            {emailEnabled && (
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email <span className="text-neutral-400">(optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="notes">
                Notes <span className="text-neutral-400">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Allergies, celebrations, requests…"
                rows={3}
              />
            </div>
            <label className="flex items-start gap-2.5 pt-1">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                className="mt-0.5 data-[state=checked]:border-rose-600 data-[state=checked]:bg-rose-600"
              />
              <span className="text-xs text-neutral-600">
                I confirm my reservation details are correct and agree to be contacted about
                this booking.
              </span>
            </label>

            {result && !result.ok && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {result.message}
              </p>
            )}

            <Button
              onClick={submit}
              disabled={!canSubmit}
              className="w-full bg-rose-600 text-white hover:bg-rose-700"
            >
              {pending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" /> Reserving…
                </>
              ) : (
                "Confirm reservation"
              )}
            </Button>
          </div>
        </Section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-800">{value}</dd>
    </div>
  );
}

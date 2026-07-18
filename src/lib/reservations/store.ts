/**
 * Reservations data-access layer (server-only).
 *
 * Live path: Supabase RPCs (`get_availability`, `book_reservation`) for anon
 * customer actions, and the service-role client for staff/admin. The atomic
 * overbooking guarantee lives in the DB function.
 *
 * Fallback path: an in-memory seed for local/preview when Supabase env is
 * absent. Same signatures, so wiring Supabase requires no UI changes. The
 * fallback is NOT durable across serverless instances — it exists only so the
 * flow is demonstrable before Supabase is connected.
 */
import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import { isEmailEnabled } from "@/lib/email/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { canBook, computeAvailability } from "./availability";
import { endOf, isValidDate, isValidStart, MAX_PARTY } from "./config";
import { SEED_RESERVATIONS } from "./seed";
import type {
  BookingErrorCode,
  BookingInput,
  BookingResult,
  Reservation,
  ReservationStatus,
  SlotAvailability,
} from "./types";

type Row = Record<string, unknown>;

export function isLive(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
function hasAdmin(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** True when running on Vercel (preview or production). */
function deployed(): boolean {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}
/**
 * The in-memory seed is a LOCAL-DEV convenience only. In any deployed
 * environment we must NEVER fall back to memory — a misconfigured deploy has to
 * fail safely instead of silently accepting real reservations into ephemeral
 * storage that vanishes on the next request/instance.
 */
function seedAllowed(): boolean {
  return !deployed();
}
class ReservationsNotConfiguredError extends Error {
  constructor(msg = "RESERVATIONS_NOT_CONFIGURED") {
    super(msg);
    this.name = "ReservationsNotConfiguredError";
  }
}
export function isConfigError(e: unknown): boolean {
  return e instanceof ReservationsNotConfiguredError;
}

// ── in-memory fallback ────────────────────────────────────────────────────────
const globalStore = globalThis as unknown as { __rcdReservations?: Reservation[] };
function mem(): Reservation[] {
  globalStore.__rcdReservations ??= SEED_RESERVATIONS.map((r) => ({ ...r }));
  return globalStore.__rcdReservations;
}

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

// ── public: availability ──────────────────────────────────────────────────────
export async function getAvailability(date: string): Promise<SlotAvailability[]> {
  if (isLive()) {
    const { data, error } = await anonClient().rpc("get_availability", { p_date: date });
    if (error) throw new Error(error.message);
    return ((data as Row[]) ?? []).map((d) => ({
      start: String(d.start_time).slice(0, 5),
      remaining: Number(d.remaining),
      capacity: Number(d.capacity),
    }));
  }
  if (!seedAllowed()) throw new ReservationsNotConfiguredError();
  return computeAvailability(mem(), date);
}

// ── public: booking ───────────────────────────────────────────────────────────
export async function createReservation(input: BookingInput): Promise<BookingResult> {
  if (!input.consent) return fail("CONSENT_REQUIRED", "Please confirm to complete your reservation.");
  if (!input.name?.trim() || !input.phone?.trim())
    return fail("MISSING_FIELDS", "Name and phone number are required.");
  if (!isValidDate(input.date)) return fail("INVALID_DATE", "Please choose July 25 or 26, 2026.");
  if (!isValidStart(input.start)) return fail("INVALID_SLOT", "Please choose a valid time slot.");
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > MAX_PARTY)
    return fail("INVALID_PARTY_SIZE", `Party size must be between 1 and ${MAX_PARTY}.`);

  // Defense in depth: never persist an email when the provider is disabled,
  // even if a client bypasses the hidden field. (CTO escape-hatch policy.)
  const safeInput: BookingInput = { ...input };
  if (!isEmailEnabled()) safeInput.email = undefined;

  if (isLive()) {
    const { data, error } = await anonClient().rpc("book_reservation", {
      p_date: input.date,
      p_start: input.start,
      p_guests: input.guests,
      p_name: input.name,
      p_phone: input.phone,
      p_email: safeInput.email ?? null,
      p_notes: safeInput.notes ?? null,
      p_consent: input.consent,
    });
    if (error) return mapDbError(error.message);
    const row = (Array.isArray(data) ? data[0] : data) as Row;
    const reservation = normalize(row);
    return { ok: true, ref: reservation.ref, reservation };
  }

  // Deployed + not live → refuse (never write to ephemeral memory).
  if (!seedAllowed())
    return fail("UNKNOWN", "Online reservations are temporarily unavailable. Please call the shop.");

  // seeded fallback (local dev only)
  const store = mem();
  if (!canBook(store, input.date, input.start, input.guests))
    return fail("SLOT_FULL", "That time just filled up — please pick another slot.");
  const reservation: Reservation = {
    id: randomUUID(),
    ref: genRef(),
    reservation_date: input.date,
    start_time: input.start,
    end_time: endOf(input.start),
    guests: input.guests,
    customer_name: input.name.trim(),
    phone: input.phone.trim(),
    email: safeInput.email?.trim() || null,
    notes: safeInput.notes?.trim() || null,
    status: "pending",
    consent: true,
    created_at: new Date().toISOString(),
  };
  store.push(reservation);
  return { ok: true, ref: reservation.ref, reservation };
}

// ── admin ─────────────────────────────────────────────────────────────────────
export async function listReservations(filters?: {
  date?: string;
  status?: ReservationStatus;
}): Promise<Reservation[]> {
  if (hasAdmin()) {
    let query = createAdminClient()
      .from("reservations")
      .select("*")
      .order("reservation_date", { ascending: true })
      .order("start_time", { ascending: true })
      .order("created_at", { ascending: true });
    if (filters?.date) query = query.eq("reservation_date", filters.date);
    if (filters?.status) query = query.eq("status", filters.status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data as Row[]) ?? []).map(normalize);
  }
  if (!seedAllowed()) throw new ReservationsNotConfiguredError("ADMIN_NOT_CONFIGURED");
  let list = mem().map((r) => ({ ...r }));
  if (filters?.date) list = list.filter((r) => r.reservation_date === filters.date);
  if (filters?.status) list = list.filter((r) => r.status === filters.status);
  return list.sort(
    (a, b) =>
      a.reservation_date.localeCompare(b.reservation_date) ||
      a.start_time.localeCompare(b.start_time) ||
      a.created_at.localeCompare(b.created_at),
  );
}

export async function getReservation(id: string): Promise<Reservation | null> {
  if (hasAdmin()) {
    const { data, error } = await createAdminClient()
      .from("reservations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? normalize(data as Row) : null;
  }
  if (!seedAllowed()) throw new ReservationsNotConfiguredError("ADMIN_NOT_CONFIGURED");
  return mem().find((r) => r.id === id) ?? null;
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
): Promise<void> {
  if (hasAdmin()) {
    const { error } = await createAdminClient()
      .from("reservations")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  if (!seedAllowed()) throw new ReservationsNotConfiguredError("ADMIN_NOT_CONFIGURED");
  const row = mem().find((r) => r.id === id);
  if (row) row.status = status;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function fail(code: BookingErrorCode, message: string): BookingResult {
  return { ok: false, code, message };
}

function genRef(): string {
  return "RCD-" + randomBytes(3).toString("hex").toUpperCase();
}

function normalize(row: Row): Reservation {
  return {
    id: String(row.id),
    ref: String(row.ref),
    reservation_date: String(row.reservation_date),
    start_time: String(row.start_time).slice(0, 5),
    end_time: String(row.end_time).slice(0, 5),
    guests: Number(row.guests),
    customer_name: String(row.customer_name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : null,
    notes: row.notes ? String(row.notes) : null,
    status: String(row.status) as ReservationStatus,
    consent: Boolean(row.consent),
    created_at: String(row.created_at),
  };
}

function mapDbError(message: string): BookingResult {
  const known: BookingErrorCode[] = [
    "SLOT_FULL",
    "CONSENT_REQUIRED",
    "INVALID_PARTY_SIZE",
    "INVALID_DATE",
    "INVALID_SLOT",
  ];
  const code = known.find((k) => message.includes(k)) ?? "UNKNOWN";
  const friendly =
    code === "SLOT_FULL"
      ? "That time just filled up — please pick another slot."
      : "Sorry, we couldn't complete your booking. Please try again.";
  return { ok: false, code, message: friendly };
}

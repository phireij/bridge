/**
 * Ruby's Cake Delights — anniversary reservation rules (single source of truth).
 * Mirrors the DB constraints in supabase/migrations. Timezone: Asia/Tokyo.
 */
export const RESERVATION_DATES = ["2026-07-25", "2026-07-26"] as const;
export type ReservationDate = (typeof RESERVATION_DATES)[number];

export const DATE_LABELS: Record<string, string> = {
  "2026-07-25": "Saturday, July 25",
  "2026-07-26": "Sunday, July 26",
};

export const CAPACITY = 12; // guests concurrently
export const MAX_PARTY = 12;
export const SLOT_STEP_MIN = 30; // slot starts every 30 minutes
export const DURATION_MIN = 60; // each reservation is 60 minutes
export const OPEN_MIN = 10 * 60; // 10:00
export const LAST_START_MIN = 19 * 60; // 19:00 (last 60-min booking ends 20:00)
export const CLOSE_MIN = 20 * 60; // 20:00

/** "HH:MM" -> minutes since midnight. */
export function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** minutes since midnight -> "HH:MM" (24h, zero-padded). */
export function fromMin(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** End time of a booking that starts at `start` ("HH:MM"). */
export function endOf(start: string): string {
  return fromMin(toMin(start) + DURATION_MIN);
}

/** All valid start slots, "10:00" .. "19:00". */
export function slotStarts(): string[] {
  const out: string[] = [];
  for (let m = OPEN_MIN; m <= LAST_START_MIN; m += SLOT_STEP_MIN) out.push(fromMin(m));
  return out;
}

/** 12h display, e.g. "10:00" -> "10:00 AM", "19:30" -> "7:30 PM". */
export function to12h(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function isValidDate(d: string): d is ReservationDate {
  return (RESERVATION_DATES as readonly string[]).includes(d);
}

export function isValidStart(t: string): boolean {
  const m = toMin(t);
  return m >= OPEN_MIN && m <= LAST_START_MIN && m % SLOT_STEP_MIN === 0;
}

/** Shop contact details (shown on the public reservation page). */
export const SHOP = {
  name: "Ruby's Cake Delights",
  addressJa: "千葉県市川市市川1-16-15 花亀ビル1F-B",
  areaEn: "Ichikawa, Chiba, Japan",
  phone: "080-4355-7227",
} as const;

/** `tel:` href for the shop phone (digits only). */
export const SHOP_TEL = `tel:${SHOP.phone.replace(/[^0-9]/g, "")}`;

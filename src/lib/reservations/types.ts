export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "arrived"
  | "no_show";

export const ACTIVE_STATUSES: ReservationStatus[] = ["pending", "confirmed", "arrived"];

export interface Reservation {
  id: string;
  ref: string;
  reservation_date: string; // YYYY-MM-DD
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  guests: number;
  customer_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: ReservationStatus;
  consent: boolean;
  created_at: string; // ISO
}

export interface BookingInput {
  date: string;
  start: string;
  guests: number;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  consent: boolean;
}

export interface SlotAvailability {
  start: string; // "HH:MM"
  remaining: number; // 0..CAPACITY
  capacity: number;
}

export type BookingResult =
  | { ok: true; ref: string; reservation: Reservation }
  | { ok: false; code: BookingErrorCode; message: string };

export type BookingErrorCode =
  | "SLOT_FULL"
  | "CONSENT_REQUIRED"
  | "INVALID_PARTY_SIZE"
  | "INVALID_DATE"
  | "INVALID_SLOT"
  | "MISSING_FIELDS"
  | "UNKNOWN";

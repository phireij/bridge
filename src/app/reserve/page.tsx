import { RESERVATION_DATES, SHOP, SHOP_TEL } from "@/lib/reservations/config";
import { getAvailability, isConfigError } from "@/lib/reservations/store";
import type { SlotAvailability } from "@/lib/reservations/types";
import { BookingFlow } from "@/components/reserve/booking-flow";

// Availability is live data — never statically cache this page.
export const dynamic = "force-dynamic";

export default async function ReservePage() {
  let initial: Record<string, SlotAvailability[]>;
  try {
    const entries = await Promise.all(
      RESERVATION_DATES.map(async (d) => [d, await getAvailability(d)] as const),
    );
    initial = Object.fromEntries(entries) as Record<string, SlotAvailability[]>;
  } catch (e) {
    // Fail safe: a deployed environment without Supabase must NOT fall back to
    // in-memory storage — show an unavailable state instead of taking bookings.
    if (isConfigError(e)) return <Unavailable />;
    throw e;
  }

  return <BookingFlow initial={initial} />;
}

function Unavailable() {
  return (
    <div className="rounded-2xl border border-rose-100 bg-white p-6 text-center shadow-sm">
      <h1 className="text-lg font-semibold">
        Online reservations are temporarily unavailable
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        We&apos;re sorry for the inconvenience — please call us to book your table.
      </p>
      <a
        href={SHOP_TEL}
        className="mt-3 inline-block text-base font-semibold text-rose-600"
      >
        {SHOP.phone}
      </a>
    </div>
  );
}

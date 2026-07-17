import { RESERVATION_DATES } from "@/lib/reservations/config";
import { getAvailability } from "@/lib/reservations/store";
import type { SlotAvailability } from "@/lib/reservations/types";
import { BookingFlow } from "@/components/reserve/booking-flow";

// Availability is live data — never statically cache this page.
export const dynamic = "force-dynamic";

export default async function ReservePage() {
  const entries = await Promise.all(
    RESERVATION_DATES.map(
      async (d) => [d, await getAvailability(d)] as const,
    ),
  );
  const initial = Object.fromEntries(entries) as Record<string, SlotAvailability[]>;

  return <BookingFlow initial={initial} />;
}

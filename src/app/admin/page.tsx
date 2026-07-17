import { RESERVATION_DATES } from "@/lib/reservations/config";
import { getAvailability, isLive, listReservations } from "@/lib/reservations/store";
import type { SlotAvailability } from "@/lib/reservations/types";
import { isAdminAuthed, isDefaultPasscode } from "@/lib/admin/auth";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    return <AdminLogin devHint={isDefaultPasscode()} />;
  }

  const [reservations, availEntries] = await Promise.all([
    listReservations(),
    Promise.all(
      RESERVATION_DATES.map(async (d) => [d, await getAvailability(d)] as const),
    ),
  ]);
  const availByDate = Object.fromEntries(availEntries) as Record<string, SlotAvailability[]>;

  return (
    <AdminDashboard
      reservations={reservations}
      availByDate={availByDate}
      live={isLive()}
    />
  );
}

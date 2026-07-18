import { RESERVATION_DATES } from "@/lib/reservations/config";
import {
  getAvailability,
  isConfigError,
  isLive,
  listReservations,
} from "@/lib/reservations/store";
import type { Reservation, SlotAvailability } from "@/lib/reservations/types";
import { isAdminAuthed, isAdminConfigured, isDefaultPasscode } from "@/lib/admin/auth";
import { getLastEmailStatusByReservation, type LastEmailStatus } from "@/lib/email/store";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    return <AdminLogin devHint={isDefaultPasscode()} configured={isAdminConfigured()} />;
  }

  let reservations: Reservation[];
  let availByDate: Record<string, SlotAvailability[]>;
  try {
    const [rows, availEntries] = await Promise.all([
      listReservations(),
      Promise.all(
        RESERVATION_DATES.map(async (d) => [d, await getAvailability(d)] as const),
      ),
    ]);
    reservations = rows;
    availByDate = Object.fromEntries(availEntries) as Record<string, SlotAvailability[]>;
  } catch (e) {
    // Fail safe: never serve seeded/in-memory admin data on a deployed env.
    if (isConfigError(e)) return <AdminUnavailable />;
    throw e;
  }

  const emailByRes: Record<string, LastEmailStatus> = await getLastEmailStatusByReservation(
    reservations.map((r) => r.id),
  );

  return (
    <AdminDashboard
      reservations={reservations}
      availByDate={availByDate}
      live={isLive()}
      emailByRes={emailByRes}
    />
  );
}

function AdminUnavailable() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
      Admin data is unavailable — Supabase isn&apos;t fully configured for this deployment
      (missing <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code>).
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";

import { isAdminAuthed, signIn, signOut } from "@/lib/admin/auth";
import { sendReservationEmail } from "@/lib/email/send";
import type { EmailKind } from "@/lib/email/templates";
import { getReservation, updateReservationStatus } from "@/lib/reservations/store";
import type { ReservationStatus } from "@/lib/reservations/types";

export async function signInAction(passcode: string): Promise<{ ok: boolean }> {
  const ok = await signIn(passcode);
  if (ok) revalidatePath("/admin");
  return { ok };
}

export async function signOutAction(): Promise<void> {
  await signOut();
  revalidatePath("/admin");
}

/** Map an admin status change to the outbound email kind, if any. */
function emailKindFor(status: ReservationStatus): EmailKind | null {
  if (status === "confirmed") return "confirmed";
  if (status === "cancelled") return "cancelled";
  return null;
}

export async function setStatusAction(
  id: string,
  status: ReservationStatus,
): Promise<{ ok: boolean }> {
  // Defense in depth: never trust the client — re-check the session server-side.
  if (!(await isAdminAuthed())) return { ok: false };
  await updateReservationStatus(id, status);

  // Fire-and-log status email AFTER the DB update succeeds. Any email failure
  // is swallowed and recorded to email_events — it must never affect the
  // reservation state the staff just committed.
  const kind = emailKindFor(status);
  if (kind) {
    try {
      const r = await getReservation(id);
      if (r) await sendReservationEmail(kind, r);
    } catch {
      // ignored — sendReservationEmail already logs.
    }
  }

  revalidatePath("/admin");
  return { ok: true };
}

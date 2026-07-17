"use server";

import { revalidatePath } from "next/cache";

import { isAdminAuthed, signIn, signOut } from "@/lib/admin/auth";
import { updateReservationStatus } from "@/lib/reservations/store";
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

export async function setStatusAction(
  id: string,
  status: ReservationStatus,
): Promise<{ ok: boolean }> {
  // Defense in depth: never trust the client — re-check the session server-side.
  if (!(await isAdminAuthed())) return { ok: false };
  await updateReservationStatus(id, status);
  revalidatePath("/admin");
  return { ok: true };
}

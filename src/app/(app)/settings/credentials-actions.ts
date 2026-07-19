"use server";

import { randomBytes } from "crypto";
import { getCurrentProfile } from "@/lib/auth/session";
import { createBridgeAdminClient } from "@/lib/supabase/bridge-admin";
import { createBridgeServerClient } from "@/lib/supabase/bridge-server";

export type RotatableAgent = "hyperagent" | "hermes";

const AGENT_EMAIL: Record<RotatableAgent, string> = {
  hyperagent: "hyperagent@bridgehq.example",
  hermes: "hermes@bridgehq.example",
};

function generatePassword() {
  // 24 random bytes -> base64url, trimmed to a clean 32-char secret.
  return randomBytes(24).toString("base64url").slice(0, 32);
}

/**
 * Mission #002A-4 — Hermes' credential management strategy.
 *
 * Rotates the given agent's Supabase Auth password via the Admin API
 * (service-role key, never exposed to the client). CEO-only. The new
 * password is returned exactly once to this call's response — it is never
 * written to any table, log, or chat. The CEO is responsible for handing it
 * to whatever process authenticates as that agent next (this agent's own
 * sandboxed session, a CI secret, etc.).
 *
 * Only an audit trail survives: who rotated which agent's credential and
 * when — never the secret itself.
 */
export async function rotateAgentCredential(
  agent: RotatableAgent,
  note?: string,
): Promise<{ newPassword: string; rotatedAt: string }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "ceo") {
    throw new Error("Only the CEO can rotate an agent credential.");
  }

  const admin = createBridgeAdminClient();
  const email = AGENT_EMAIL[agent];

  const { data: userList, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw new Error(listError.message);
  const user = userList.users.find((u) => u.email === email);
  if (!user) throw new Error(`No Supabase Auth user found for ${email}.`);

  const newPassword = generatePassword();
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });
  if (updateError) throw new Error(updateError.message);

  const rotatedAt = new Date().toISOString();

  // Audit only — no secret written anywhere past this function's return value.
  const supabase = await createBridgeServerClient();
  await supabase.from("credential_rotations").insert({
    agent_name: agent === "hyperagent" ? "HyperAgent" : "Hermes",
    rotated_by: profile.id,
    note: note ?? null,
  });

  return { newPassword, rotatedAt };
}

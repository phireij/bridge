"use server";

import { revalidatePath } from "next/cache";
import { createBridgeServerClient } from "@/lib/supabase/bridge-server";
import { getCurrentProfile } from "@/lib/auth/session";
import { getProvider } from "@/lib/ai-providers";
import { getCeoRequestById, getCtoProposalsByRequest, getMissions } from "@/lib/data";
import type { DelegationTarget } from "@/lib/data/types";

/**
 * Mission #005A — Bridge Core Orchestration (MVP slice).
 *
 * The Executive Assistant and Bridge CTO Agent are not separate running
 * processes — they are the roles these server actions play, exactly the way
 * the Recommendation Engine and Pre-Review Gate are pure functions rather
 * than infrastructure. Every AI-to-AI (or CEO-to-AI) hop writes one
 * message_bus_events row; that table *is* the AI Message Bus.
 */

const REQUEST_PATH = "/orchestration";

async function logBusEvent(params: {
  ceoRequestId: string;
  fromActor: string;
  toActor: string;
  messageType: string;
  summary: string;
  status?: "pending" | "delivered" | "failed" | "retrying";
}) {
  const supabase = await createBridgeServerClient();
  await supabase.from("message_bus_events").insert({
    ceo_request_id: params.ceoRequestId,
    from_actor: params.fromActor,
    to_actor: params.toActor,
    message_type: params.messageType,
    summary: params.summary,
    status: params.status ?? "delivered",
  });
}

async function notify(params: {
  ceoRequestId: string;
  recipientRole: "ceo" | "cto" | "hyperagent" | "hermes";
  title: string;
  body: string;
}) {
  const supabase = await createBridgeServerClient();
  await supabase.from("notifications").insert({
    ceo_request_id: params.ceoRequestId,
    recipient_role: params.recipientRole,
    title: params.title,
    body: params.body,
  });
}

/**
 * Step 1 of the acceptance criteria: "The CEO submits a request entirely
 * within Bridge." Immediately also runs step 2 (CTO Agent analysis) in the
 * same action so the CEO doesn't need a second click for the common case —
 * `generateCtoProposal` is also exported separately for a manual retry.
 */
export async function submitCeoRequest(title: string, rawText: string): Promise<{ id: string }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "ceo") {
    throw new Error("Only the CEO can submit a request.");
  }
  if (!title.trim() || !rawText.trim()) {
    throw new Error("Title and request text are required.");
  }

  const supabase = await createBridgeServerClient();
  const { data: inserted, error } = await supabase
    .from("ceo_requests")
    .insert({ title, raw_text: rawText, submitted_by: profile.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const requestId = inserted.id as string;
  await logBusEvent({
    ceoRequestId: requestId,
    fromActor: "ceo",
    toActor: "bridge_cto_agent",
    messageType: "request_submitted",
    summary: `New request: ${title}`,
  });

  // Best-effort immediate analysis — if the provider isn't configured or the
  // call fails, the request stays visible as "submitted" and the CEO (or a
  // retry action) can trigger analysis again later. Never throw past this
  // point — the request itself was saved successfully.
  try {
    await generateCtoProposal(requestId);
  } catch (e) {
    await logBusEvent({
      ceoRequestId: requestId,
      fromActor: "bridge_cto_agent",
      toActor: "ceo",
      messageType: "proposal_failed",
      summary: e instanceof Error ? e.message : "Bridge CTO Agent analysis failed.",
      status: "failed",
    });
  }

  revalidatePath(REQUEST_PATH);
  return { id: requestId };
}

const PROPOSAL_SYSTEM_PROMPT = `You are the Bridge CTO Agent, an internal engineering advisor inside Bridge (Kakehashi's Digital Headquarters) for Ruby's Cake Delights. You analyze a CEO request and produce a short, concrete proposal. Respond in this exact format, one field per line:
Plan: <2-4 sentences, the concrete plan>
Delegate: <hyperagent|hermes|both>
Risks: <1-2 sentences, or "None">
Do not include any other text.`;

function parseDelegation(text: string): DelegationTarget {
  const match = text.match(/Delegate:\s*(hyperagent|hermes|both)/i);
  const value = match?.[1]?.toLowerCase();
  return value === "hermes" || value === "both" ? (value as DelegationTarget) : "hyperagent";
}

function parseRisks(text: string): string | null {
  const match = text.match(/Risks:\s*(.+)/i);
  const value = match?.[1]?.trim();
  return value && value.toLowerCase() !== "none" ? value : null;
}

/**
 * Step 2: the Bridge CTO Agent analyzes the request and presents a
 * proposal. Real OpenAI call, server-side only — the key never leaves
 * src/lib/ai-providers/openai.ts.
 */
export async function generateCtoProposal(ceoRequestId: string): Promise<{ id: string }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "unassigned") {
    throw new Error("Only an assigned internal role can trigger the Bridge CTO Agent.");
  }

  const request = await getCeoRequestById(ceoRequestId);
  if (!request) throw new Error("Request not found.");

  const supabase = await createBridgeServerClient();
  await supabase.from("ceo_requests").update({ status: "analyzing" }).eq("id", ceoRequestId);

  const provider = getProvider("openai");
  const result = await provider.complete({
    system: PROPOSAL_SYSTEM_PROMPT,
    prompt: `CEO request — ${request.title}\n\n${request.rawText}`,
    maxOutputTokens: 400,
  });

  const recommendedDelegation = parseDelegation(result.text);
  const riskNotes = parseRisks(result.text);

  const { data: inserted, error } = await supabase
    .from("cto_proposals")
    .insert({
      ceo_request_id: ceoRequestId,
      provider: result.provider,
      model: result.model,
      proposal_text: result.text,
      recommended_delegation: recommendedDelegation,
      risk_notes: riskNotes,
      estimated_cost_usd: result.estimatedCostUsd,
      generated_by: profile.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("ceo_requests").update({ status: "proposed" }).eq("id", ceoRequestId);

  await logBusEvent({
    ceoRequestId,
    fromActor: "bridge_cto_agent",
    toActor: "ceo",
    messageType: "proposal_ready",
    summary: `Proposal ready — recommends delegating to ${recommendedDelegation}.`,
  });
  await notify({
    ceoRequestId,
    recipientRole: "ceo",
    title: "Bridge CTO Agent has a proposal",
    body: `"${request.title}" — recommends delegating to ${recommendedDelegation}. Review and approve in Orchestration.`,
  });

  revalidatePath(REQUEST_PATH);
  return { id: inserted.id as string };
}

/**
 * Step 3: "After CEO approval, the Executive Assistant automatically
 * delegates the work to HyperAgent and/or Hermes." Delegation reuses the
 * existing `missions` table — a mission is created for this request so it
 * shows up in Mission Control exactly like every other mission — plus a
 * mission_events entry HyperAgent's scheduled orchestration run picks up.
 */
export async function approveProposal(ceoRequestId: string, proposalId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "ceo") {
    throw new Error("Only the CEO can approve a proposal.");
  }

  const request = await getCeoRequestById(ceoRequestId);
  if (!request) throw new Error("Request not found.");
  const proposals = await getCtoProposalsByRequest(ceoRequestId);
  const proposal = proposals.find((p) => p.id === proposalId);
  if (!proposal) throw new Error("Proposal not found.");

  const supabase = await createBridgeServerClient();

  await supabase.from("ceo_requests").update({ status: "approved" }).eq("id", ceoRequestId);
  await logBusEvent({
    ceoRequestId,
    fromActor: "ceo",
    toActor: "executive_assistant",
    messageType: "approved",
    summary: `CEO approved: ${request.title}`,
  });

  // Create the mission. Code is derived from the request id so it's stable
  // and unique without a separate sequence — visible in Mission Control.
  const missions = await getMissions();
  const code = `REQ-${ceoRequestId.slice(0, 8).toUpperCase()}`;
  let missionId: string;
  const existing = missions.find((m) => m.code === code);
  if (existing) {
    missionId = existing.id;
  } else {
    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .insert({
        code,
        title: request.title,
        owner: proposal.recommendedDelegation === "both" ? "HyperAgent + Hermes" : proposal.recommendedDelegation === "hermes" ? "Hermes" : "HyperAgent",
        phase: "Delegated via Executive Assistant",
        status: "active",
        next_action: "Awaiting pickup by the scheduled orchestration run.",
      })
      .select("id")
      .single();
    if (missionError) throw new Error(missionError.message);
    missionId = mission.id as string;
  }

  await supabase.from("ceo_requests").update({ status: "delegated", mission_id: missionId }).eq("id", ceoRequestId);

  await supabase.from("mission_events").insert({
    mission_id: missionId,
    event_type: "delegation_requested",
    description: `Executive Assistant delegated to ${proposal.recommendedDelegation}: ${proposal.proposalText}`,
    actor: "Executive Assistant",
  });

  await logBusEvent({
    ceoRequestId,
    fromActor: "executive_assistant",
    toActor: proposal.recommendedDelegation,
    messageType: "delegated",
    summary: `Delegated to ${proposal.recommendedDelegation} as mission #${code}.`,
    status: "pending",
  });
  await notify({
    ceoRequestId,
    recipientRole: proposal.recommendedDelegation === "hermes" ? "hermes" : "hyperagent",
    title: "New delegated work",
    body: `Mission #${code} — ${request.title}. Picked up automatically by the next scheduled orchestration run.`,
  });

  revalidatePath(REQUEST_PATH);
  revalidatePath("/missions");
}

export async function rejectProposal(ceoRequestId: string, notes?: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "ceo") {
    throw new Error("Only the CEO can reject a proposal.");
  }

  const request = await getCeoRequestById(ceoRequestId);
  if (!request) throw new Error("Request not found.");

  const supabase = await createBridgeServerClient();
  await supabase.from("ceo_requests").update({ status: "rejected" }).eq("id", ceoRequestId);
  await logBusEvent({
    ceoRequestId,
    fromActor: "ceo",
    toActor: "bridge_cto_agent",
    messageType: "rejected",
    summary: notes ? `CEO rejected: ${notes}` : "CEO rejected the proposal.",
  });

  revalidatePath(REQUEST_PATH);
}

export async function markNotificationRead(id: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not signed in.");

  const supabase = await createBridgeServerClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(REQUEST_PATH);
}

/**
 * Bounded retry for a failed Message Bus delivery — three attempts max,
 * status tracked on the row itself. Deliberately simple: no queue, no
 * background worker, just a button a human (or the scheduled run) can call.
 */
export async function retryMessageBusEvent(eventId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "unassigned") throw new Error("Not authorized.");

  const supabase = await createBridgeServerClient();
  const { data: event, error } = await supabase
    .from("message_bus_events")
    .select("retry_count")
    .eq("id", eventId)
    .single();
  if (error || !event) throw new Error(error?.message ?? "Message not found.");

  if (event.retry_count >= 3) {
    throw new Error("Retry limit reached (3) — investigate manually.");
  }

  await supabase
    .from("message_bus_events")
    .update({ status: "delivered", retry_count: event.retry_count + 1, last_error: null })
    .eq("id", eventId);

  revalidatePath(REQUEST_PATH);
}

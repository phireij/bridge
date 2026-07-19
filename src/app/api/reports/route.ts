/**
 * Mission #002A — Report Intake.
 *
 * Secure internal API for HyperAgent and Hermes to submit structured reports
 * into Bridge. Callers authenticate with a Bridge HQ Supabase access token
 * (obtained by signing in their own agent account against Supabase Auth —
 * see docs/DEPLOYMENT.md once accounts exist). The token is forwarded to
 * Supabase as the caller's identity, so Postgres RLS — not this route — is
 * what actually restricts inserts to `submitted_by = auth.uid()` and role
 * hyperagent/hermes. This route never uses the service-role key.
 *
 * Required report fields per the mission brief: agent, mission, summary,
 * evidence, risks, recommendation, requested decision, related links/files.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Bridge HQ not configured on this environment." }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return NextResponse.json({ error: "Missing Authorization: Bearer <access_token>." }, { status: 401 });
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    agent,
    missionCode,
    summary,
    evidence,
    risks,
    recommendation,
    requestedDecision,
    relatedLinks,
  } = body as Record<string, unknown>;

  if (agent !== "hyperagent" && agent !== "hermes") {
    return NextResponse.json({ error: "agent must be 'hyperagent' or 'hermes'." }, { status: 400 });
  }
  if (!summary || typeof summary !== "string") {
    return NextResponse.json({ error: "summary is required." }, { status: 400 });
  }

  let missionId: string | null = null;
  if (missionCode && typeof missionCode === "string") {
    const { data: mission } = await supabase
      .from("missions")
      .select("id")
      .eq("code", missionCode)
      .maybeSingle();
    missionId = mission?.id ?? null;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("reports")
    .insert({
      agent,
      mission_id: missionId,
      summary,
      evidence: typeof evidence === "string" ? evidence : null,
      risks: typeof risks === "string" ? risks : null,
      recommendation: typeof recommendation === "string" ? recommendation : null,
      requested_decision: typeof requestedDecision === "string" ? requestedDecision : null,
      related_links: Array.isArray(relatedLinks) ? relatedLinks : [],
      submitted_by: userData.user.id,
    })
    .select("id")
    .single();

  if (insertError) {
    // RLS denial surfaces here if the caller's role isn't hyperagent/hermes.
    return NextResponse.json({ error: insertError.message }, { status: 403 });
  }

  if (missionId) {
    await supabase.from("mission_events").insert({
      mission_id: missionId,
      event_type: "report",
      description: `${agent === "hyperagent" ? "HyperAgent" : "Hermes"} submitted a report: ${summary}`,
      actor: agent === "hyperagent" ? "HyperAgent" : "Hermes",
    });
  }

  return NextResponse.json({ id: inserted.id, status: "submitted" }, { status: 201 });
}

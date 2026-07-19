import { NextResponse } from "next/server";
import { createBridgeServerClient } from "@/lib/supabase/bridge-server";

export async function POST(request: Request) {
  const supabase = await createBridgeServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}

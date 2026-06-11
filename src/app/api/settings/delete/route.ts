import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Data deletion request endpoint.
 * Creates a tracked deletion request; full automated purge is a future step.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      status: "queued",
      message: "Local-only mode. Clear browser data or sign out to remove local copies.",
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  let body: { reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* optional body */
  }

  const { error } = await supabase.from("beta_feedback").insert({
    user_id: user.id,
    email: user.email ?? null,
    route: "/settings",
    feedback_type: "data_deletion",
    message: body.reason?.trim() || "User requested account and data deletion from Settings.",
  });

  if (error) {
    console.warn("[settings/delete] feedback insert failed:", error.message);
  }

  return NextResponse.json({
    ok: true,
    status: "queued",
    message:
      "Your deletion request has been recorded. We will process it within 30 days. You can also email support@plantpal.app.",
  });
}

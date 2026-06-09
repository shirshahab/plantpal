import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { runSetupCheck } from "@/lib/setup/run-setup-check";

export async function GET() {
  try {
    const supabase = isSupabaseConfigured() ? await createClient() : null;
    const report = await runSetupCheck(supabase);
    return NextResponse.json({ ok: true, data: report });
  } catch (e) {
    console.error("[api/setup/check]", e);
    return NextResponse.json(
      { ok: false, error: "Setup check failed to run." },
      { status: 500 }
    );
  }
}

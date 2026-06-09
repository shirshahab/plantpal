import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  EXPECTED_PROJECT_REF,
  getProjectRefFromUrl,
  getSupabasePublicConfig,
  isMockMode,
  maskAnonKey,
} from "@/lib/supabase/config";
import { runSupabaseDiagnostics } from "@/lib/supabase/diagnostics";

export async function GET() {
  const { url, key } = getSupabasePublicConfig();
  const projectRef = getProjectRefFromUrl(url);
  const mockMode = isMockMode();

  if (mockMode) {
    return NextResponse.json({
      source: "server",
      url: url || "(missing)",
      projectRef,
      expectedProjectRef: EXPECTED_PROJECT_REF,
      projectRefMatches: projectRef === EXPECTED_PROJECT_REF,
      anonKeyPreview: maskAnonKey(key),
      mockMode: true,
      auth: {
        hasSession: false,
        userId: null,
        email: null,
        authError: "Mock mode — Supabase env vars missing or invalid",
      },
      tables: [],
    });
  }

  const supabase = await createClient();
  const diagnostics = await runSupabaseDiagnostics(supabase, {
    url,
    anonKeyPreview: maskAnonKey(key),
    mockMode: false,
    projectRef,
  });

  return NextResponse.json({
    source: "server",
    expectedProjectRef: EXPECTED_PROJECT_REF,
    projectRefMatches: projectRef === EXPECTED_PROJECT_REF,
    ...diagnostics,
  });
}

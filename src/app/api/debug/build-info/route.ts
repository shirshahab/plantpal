import { NextResponse } from "next/server";
import { getBuildInfo, getRuntimeAuthConfig } from "@/lib/build/build-info";

/**
 * Temporary deploy verification endpoint — no secrets exposed.
 * GET /api/debug/build-info
 */
export async function GET() {
  const build = getBuildInfo();
  const runtime = getRuntimeAuthConfig();

  return NextResponse.json({
    ok: true,
    commit: build.commit,
    branch: build.branch,
    builtAt: build.builtAt,
    version: build.version,
    buildTime: {
      supabaseUrlConfigured: build.build.supabaseUrlConfigured,
      supabaseAnonKeyConfigured: build.build.supabaseAnonKeyConfigured,
      vercelEnv: build.build.vercelEnv,
    },
    runtime: {
      supabaseUrlConfigured: runtime.supabaseUrlConfigured,
      supabaseAnonKeyConfigured: runtime.supabaseAnonKeyConfigured,
      nodeEnv: runtime.nodeEnv,
    },
  });
}

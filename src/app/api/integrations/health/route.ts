import { NextResponse } from "next/server";
import { getIntegrationsHealth } from "@/lib/integrations/health";

export async function GET() {
  try {
    const integrations = await getIntegrationsHealth();
    const liveCount = integrations.filter((i) => i.usingLive).length;
    return NextResponse.json({
      ok: true,
      data: integrations,
      summary: {
        total: integrations.length,
        configured: integrations.filter((i) => i.configured).length,
        live: liveCount,
        fallback: integrations.filter((i) => i.fallbackActive).length,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error("[api/integrations/health]", e);
    return NextResponse.json({ ok: false, error: "Health check failed" }, { status: 500 });
  }
}

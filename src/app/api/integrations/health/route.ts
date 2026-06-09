import { NextResponse } from "next/server";
import { getIntegrationsHealth } from "@/lib/integrations/health";

export async function GET() {
  try {
    const integrations = getIntegrationsHealth();
    return NextResponse.json({ ok: true, data: integrations });
  } catch (e) {
    console.error("[api/integrations/health]", e);
    return NextResponse.json({ ok: false, error: "Health check failed" }, { status: 500 });
  }
}

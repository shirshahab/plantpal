import { NextResponse } from "next/server";
import { getF5BotDashboardStats, importF5BotFeed } from "@/lib/intelligence/f5bot";
import { isDebugToolingEnabled } from "@/lib/dev/dev-only";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDebugToolingEnabled()) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const stats = await getF5BotDashboardStats();
  return NextResponse.json({ ok: true, stats });
}

export async function POST() {
  if (!isDebugToolingEnabled()) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const result = await importF5BotFeed();
  const stats = await getF5BotDashboardStats();
  return NextResponse.json({ ok: result.ok, import: result, stats });
}

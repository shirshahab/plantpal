import { NextResponse } from "next/server";
import { importF5BotFeed } from "@/lib/intelligence/f5bot";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return true;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${cronSecret}`) return true;

  const urlSecret = new URL(request.url).searchParams.get("secret");
  return urlSecret === cronSecret;
}

/** Cron-ready F5Bot import. Set CRON_SECRET to protect in production. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await importF5BotFeed();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

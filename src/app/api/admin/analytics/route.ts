import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDebugToolingEnabled } from "@/lib/dev/dev-only";
import { FOUNDER_MODE_COOKIE } from "@/lib/billing/beta-unlock";

export const dynamic = "force-dynamic";

interface EventRow {
  event_name: string;
  properties: Record<string, unknown> | null;
  session_id: string | null;
  user_id: string | null;
  created_at: string;
}

/**
 * Founder analytics funnel — aggregates the last 30 days of events.
 * Available in dev, or in production with the founder-mode cookie set.
 * Reads with the service role key (RLS otherwise limits reads to own rows).
 */
export async function GET() {
  const cookieStore = await cookies();
  const isFounder = cookieStore.get(FOUNDER_MODE_COOKIE)?.value === "true";
  if (!isDebugToolingEnabled() && !isFounder) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return NextResponse.json({
      ok: true,
      configured: false,
      note: "Set SUPABASE_SERVICE_ROLE_KEY to enable the analytics dashboard.",
    });
  }

  const admin = createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("analytics_events")
    .select("event_name, properties, session_id, user_id, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as EventRow[];

  // Totals by event.
  const totals: Record<string, number> = {};
  for (const r of rows) totals[r.event_name] = (totals[r.event_name] ?? 0) + 1;

  // Funnel: unique users (fall back to session) per milestone.
  const uniq = (filter: (r: EventRow) => boolean): number => {
    const ids = new Set<string>();
    for (const r of rows) {
      if (filter(r)) ids.add(r.user_id ?? r.session_id ?? "anon");
    }
    return ids.size;
  };
  const funnel = {
    signups: uniq((r) => r.event_name === "signup"),
    onboardingComplete: uniq((r) => r.event_name === "onboarding_complete"),
    // Unique users who reached each milestone at least once.
    firstPlant: uniq((r) => r.event_name === "plant_added"),
    firstScan: uniq((r) => r.event_name === "scan"),
    firstLesson: uniq((r) => r.event_name === "lesson_completed"),
  };

  // Daily active sessions over the last 14 days (return-visit proxy).
  const daily: Record<string, Set<string>> = {};
  for (const r of rows) {
    if (r.event_name !== "session_start") continue;
    const day = r.created_at.slice(0, 10);
    (daily[day] ??= new Set()).add(r.session_id ?? r.user_id ?? "anon");
  }
  const dailySessions = Object.entries(daily)
    .map(([day, set]) => ({ day, sessions: set.size }))
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-14);

  // Notification engagement.
  const notifications = {
    sent: totals["notification_sent"] ?? 0,
    opened: totals["notification_opened"] ?? 0,
    remindersCompleted: totals["reminder_completed"] ?? 0,
  };

  return NextResponse.json({
    ok: true,
    configured: true,
    windowDays: 30,
    sampleSize: rows.length,
    totals,
    funnel,
    dailySessions,
    notifications,
  });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AnalyticsEventName } from "@/lib/analytics/events";

interface AnalyticsBody {
  event: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null>;
  route?: string;
  sessionId?: string;
  timestamp?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyticsBody;
    if (!body.event) {
      return NextResponse.json({ ok: false, error: "event required" }, { status: 400 });
    }

    const row = {
      event_name: body.event,
      properties: body.properties ?? {},
      route: body.route ?? null,
      session_id: body.sessionId ?? null,
      user_id: null as string | null,
      created_at: body.timestamp ?? new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) row.user_id = user.id;

    const { error } = await supabase.from("analytics_events").insert(row);
    if (error) {
      console.error("[analytics]", error.message);
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    return NextResponse.json({ ok: true, storage: "supabase" as const });
  } catch (e) {
    console.error("[analytics]", e);
    return NextResponse.json({ ok: false, error: "Failed to record event" }, { status: 500 });
  }
}

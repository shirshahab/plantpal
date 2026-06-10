import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const EVENTS = ["sent", "opened", "completed"] as const;

interface NotificationAnalyticsBody {
  event?: string;
  notificationId?: string;
  notificationType?: string;
}

/** Record notification lifecycle events for retention analysis. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NotificationAnalyticsBody;
    const event = body.event?.trim() ?? "";

    if (!EVENTS.includes(event as (typeof EVENTS)[number])) {
      return NextResponse.json({ ok: false, error: "Invalid event." }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("notification_analytics").insert({
      user_id: user?.id ?? null,
      notification_id: body.notificationId?.slice(0, 120) ?? null,
      notification_type: body.notificationType?.slice(0, 40) ?? null,
      event,
    });

    if (error) {
      console.error("[notification-analytics]", error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[notification-analytics]", e);
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SocialNotification } from "@/lib/social/types";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, notifications: [], unread: 0, storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, notifications: [], unread: 0 });
  }

  const { data } = await supabase
    .from("social_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const notifications: SocialNotification[] = (data ?? []).map((row) => ({
    id: row.id,
    notificationType: row.notification_type,
    title: row.title,
    body: row.body ?? "",
    link: row.link,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));

  const unread = notifications.filter((n) => !n.readAt).length;
  return NextResponse.json({ ok: true, notifications, unread });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  if (body.action === "mark_read") {
    const id = body.id as string | undefined;
    if (id) {
      await supabase
        .from("social_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("social_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

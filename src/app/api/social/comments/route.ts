import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ActivityComment, SocialProfile } from "@/lib/social/types";

function profileFrom(row: {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}): SocialProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url,
  };
}

export async function GET(request: Request) {
  const feedId = new URL(request.url).searchParams.get("feedId");
  if (!feedId) {
    return NextResponse.json({ ok: false, error: "feedId required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, comments: [], storage: "local" as const });
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("activity_comments")
    .select("*")
    .eq("feed_id", feedId)
    .order("created_at", { ascending: true });

  const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, profileFrom(p)]));

  const comments: ActivityComment[] = (rows ?? []).map((row) => ({
    id: row.id,
    feedId: row.feed_id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
    author: profileMap.get(row.user_id),
  }));

  return NextResponse.json({ ok: true, comments });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const feedId = body.feedId as string;
  const text = (body.body as string)?.trim();
  if (!feedId || !text) {
    return NextResponse.json({ ok: false, error: "feedId and body required" }, { status: 400 });
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

  const { data, error } = await supabase
    .from("activity_comments")
    .insert({ feed_id: feedId, user_id: user.id, body: text.slice(0, 500) })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  const { data: feedRow } = await supabase
    .from("activity_feed")
    .select("user_id, title")
    .eq("id", feedId)
    .single();

  if (feedRow && feedRow.user_id !== user.id) {
    await supabase.from("social_notifications").insert({
      user_id: feedRow.user_id,
      notification_type: "comment",
      title: "New comment on your post",
      body: text.slice(0, 120),
      link: "/dashboard",
    });
  }

  return NextResponse.json({ ok: true, id: data.id });
}

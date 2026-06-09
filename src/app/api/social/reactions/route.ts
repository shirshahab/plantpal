import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ActivityReactionType } from "@/lib/social/types";

const VALID: ActivityReactionType[] = [
  "growing_strong",
  "beautiful",
  "great_harvest",
  "nice_work",
];

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const feedId = body.feedId as string;
  const reactionType = body.reactionType as ActivityReactionType;
  const remove = body.remove === true;

  if (!feedId || !VALID.includes(reactionType)) {
    return NextResponse.json({ ok: false, error: "feedId and reactionType required" }, { status: 400 });
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

  if (remove) {
    await supabase
      .from("activity_reactions")
      .delete()
      .eq("feed_id", feedId)
      .eq("user_id", user.id)
      .eq("reaction_type", reactionType);
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("activity_reactions").upsert({
    feed_id: feedId,
    user_id: user.id,
    reaction_type: reactionType,
  });

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
      notification_type: "reaction",
      title: "Someone reacted to your post",
      body: feedRow.title,
      link: "/dashboard",
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const feedId = new URL(request.url).searchParams.get("feedId");
  if (!feedId || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, reactions: [] });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_reactions")
    .select("reaction_type, user_id")
    .eq("feed_id", feedId);

  return NextResponse.json({ ok: true, reactions: data ?? [] });
}

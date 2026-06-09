import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  ActivityFeedEvent,
  ActivityReactionType,
  FeedEventType,
  FeedFilter,
  FeedVisibility,
  SocialProfile,
} from "@/lib/social/types";
import { DEMO_FEED_EVENTS, EVENT_EMOJI } from "@/lib/social/constants";

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

function matchesFilter(event: ActivityFeedEvent, filter: FeedFilter, userId: string | null): boolean {
  switch (filter) {
    case "all":
      return true;
    case "friends":
      return event.visibility === "friends" || event.visibility === "public";
    case "family":
      return event.visibility === "circle" && !!event.groupId;
    case "groups":
      return !!event.groupId;
    case "mine":
      return event.userId === userId;
    case "photos":
      return event.eventType === "growth_photo" || event.eventType === "journal_entry";
    case "achievements":
      return (
        event.eventType === "badge_earned" ||
        event.eventType === "challenge_completed" ||
        event.eventType === "streak_milestone"
      );
    default:
      return true;
  }
}

function demoEvents(): ActivityFeedEvent[] {
  const now = Date.now();
  return DEMO_FEED_EVENTS.map((d, i) => ({
    id: `demo-${i}`,
    userId: `demo-user-${i}`,
    eventType: d.eventType,
    visibility: "friends" as FeedVisibility,
    groupId: d.actorName === "Family Garden" ? "demo-family" : null,
    title: d.title,
    body: "",
    emoji: d.emoji,
    payload: {},
    createdAt: new Date(now - i * 3600000).toISOString(),
    actor: {
      id: `demo-user-${i}`,
      fullName: d.actorName,
      email: null,
      avatarUrl: null,
    },
    reactionCounts: { nice_work: i % 3 },
    commentCount: i % 2,
  }));
}

export async function GET(request: Request) {
  const filter = (new URL(request.url).searchParams.get("filter") ?? "all") as FeedFilter;
  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit") ?? 20), 50);

  if (!isSupabaseConfigured()) {
    const events = demoEvents().filter((e) => matchesFilter(e, filter, null));
    return NextResponse.json({ ok: true, events: events.slice(0, limit), storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const events = demoEvents().filter((e) => matchesFilter(e, filter, null));
    return NextResponse.json({ ok: true, events: events.slice(0, limit), storage: "demo" as const });
  }

  const { data: rows, error } = await supabase
    .from("activity_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error) {
    console.error("[social/feed GET]", error.message);
    return NextResponse.json({ ok: true, events: demoEvents().slice(0, limit), storage: "fallback" as const });
  }

  const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, profileFrom(p)]));

  const feedIds = (rows ?? []).map((r) => r.id);
  const [{ data: reactions }, { data: comments }] = await Promise.all([
    feedIds.length
      ? supabase.from("activity_reactions").select("feed_id, reaction_type, user_id").in("feed_id", feedIds)
      : Promise.resolve({ data: [] }),
    feedIds.length
      ? supabase.from("activity_comments").select("feed_id").in("feed_id", feedIds)
      : Promise.resolve({ data: [] }),
  ]);

  const reactionCounts = new Map<string, Partial<Record<ActivityReactionType, number>>>();
  const userReactions = new Map<string, ActivityReactionType>();
  for (const r of reactions ?? []) {
    const counts = reactionCounts.get(r.feed_id) ?? {};
    const type = r.reaction_type as ActivityReactionType;
    counts[type] = (counts[type] ?? 0) + 1;
    reactionCounts.set(r.feed_id, counts);
    if (r.user_id === user.id) userReactions.set(r.feed_id, type);
  }

  const commentCounts = new Map<string, number>();
  for (const c of comments ?? []) {
    commentCounts.set(c.feed_id, (commentCounts.get(c.feed_id) ?? 0) + 1);
  }

  const events: ActivityFeedEvent[] = (rows ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    eventType: row.event_type as FeedEventType,
    visibility: row.visibility as FeedVisibility,
    groupId: row.group_id,
    title: row.title,
    body: row.body ?? "",
    emoji: row.emoji ?? EVENT_EMOJI[row.event_type as FeedEventType] ?? "🌱",
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    actor: profileMap.get(row.user_id),
    reactionCounts: reactionCounts.get(row.id),
    commentCount: commentCounts.get(row.id) ?? 0,
    userReaction: userReactions.get(row.id) ?? null,
  }));

  const filtered = events.filter((e) => matchesFilter(e, filter, user.id)).slice(0, limit);

  if (filtered.length === 0) {
    return NextResponse.json({
      ok: true,
      events: demoEvents().filter((e) => matchesFilter(e, filter, user.id)).slice(0, limit),
      storage: "demo" as const,
    });
  }

  return NextResponse.json({ ok: true, events: filtered, storage: "supabase" as const });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = body.eventType as FeedEventType;
  const title = body.title as string;
  if (!eventType || !title) {
    return NextResponse.json({ ok: false, error: "eventType and title required" }, { status: 400 });
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
    .from("activity_feed")
    .insert({
      user_id: user.id,
      event_type: eventType,
      title,
      body: (body.body as string) ?? "",
      visibility: (body.visibility as FeedVisibility) ?? "friends",
      group_id: (body.groupId as string) ?? null,
      emoji: (body.emoji as string) ?? EVENT_EMOJI[eventType],
      payload: (body.payload as Record<string, unknown>) ?? {},
    })
    .select("id")
    .single();

  if (error) {
    console.error("[social/feed POST]", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id, storage: "supabase" as const });
}

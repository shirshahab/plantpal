import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Friend, FriendRequest, SocialProfile } from "@/lib/social/types";

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

async function getProfileMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[]
): Promise<Map<string, SocialProfile>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", ids);
  const map = new Map<string, SocialProfile>();
  for (const row of data ?? []) {
    map.set(row.id, profileFrom(row));
  }
  return map;
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      friends: [],
      incoming: [],
      outgoing: [],
      storage: "local" as const,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  const [{ data: friendRows }, { data: incoming }, { data: outgoing }] = await Promise.all([
    supabase.from("friends").select("*").eq("user_id", user.id),
    supabase.from("friend_requests").select("*").eq("to_user_id", user.id).eq("status", "pending"),
    supabase.from("friend_requests").select("*").eq("from_user_id", user.id).eq("status", "pending"),
  ]);

  const profileIds = new Set<string>();
  for (const f of friendRows ?? []) profileIds.add(f.friend_id);
  for (const r of incoming ?? []) profileIds.add(r.from_user_id);
  for (const r of outgoing ?? []) profileIds.add(r.to_user_id);

  const profiles = await getProfileMap(supabase, [...profileIds]);

  const friends: Friend[] = (friendRows ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    friendId: row.friend_id,
    createdAt: row.created_at,
    profile: profiles.get(row.friend_id) ?? {
      id: row.friend_id,
      fullName: "Friend",
      email: null,
      avatarUrl: null,
    },
  }));

  const mapRequest = (row: {
    id: string;
    from_user_id: string;
    to_user_id: string;
    status: string;
    created_at: string;
  }): FriendRequest => ({
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    status: row.status as FriendRequest["status"],
    createdAt: row.created_at,
    profile: profiles.get(
      row.from_user_id === user.id ? row.to_user_id : row.from_user_id
    ),
  });

  return NextResponse.json({
    ok: true,
    friends,
    incoming: (incoming ?? []).map(mapRequest),
    outgoing: (outgoing ?? []).map(mapRequest),
    storage: "supabase" as const,
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action as string;
  const targetUserId = body.userId as string | undefined;

  if (!action || !targetUserId) {
    return NextResponse.json({ ok: false, error: "action and userId required" }, { status: 400 });
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

  if (action === "send_request") {
    const { error } = await supabase.from("friend_requests").insert({
      from_user_id: user.id,
      to_user_id: targetUserId,
    });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    await supabase.from("social_notifications").insert({
      user_id: targetUserId,
      notification_type: "friend_request",
      title: "New friend request",
      body: "Someone wants to connect on PlantPal",
      link: "/friends",
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "accept") {
    const { data: req } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("id", body.requestId as string)
      .eq("to_user_id", user.id)
      .single();

    if (!req) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    await supabase
      .from("friend_requests")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", req.id);

    await supabase.from("friends").insert([
      { user_id: user.id, friend_id: req.from_user_id },
      { user_id: req.from_user_id, friend_id: user.id },
    ]);

    await supabase.from("social_notifications").insert({
      user_id: req.from_user_id,
      notification_type: "friend_accepted",
      title: "Friend request accepted",
      body: "You're now connected on PlantPal",
      link: "/friends",
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "decline") {
    await supabase
      .from("friend_requests")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", body.requestId as string)
      .eq("to_user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    await supabase.from("friends").delete().eq("user_id", user.id).eq("friend_id", targetUserId);
    await supabase.from("friends").delete().eq("user_id", targetUserId).eq("friend_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "block") {
    await supabase.from("blocked_users").upsert({
      blocker_id: user.id,
      blocked_id: targetUserId,
    });
    await supabase.from("friends").delete().eq("user_id", user.id).eq("friend_id", targetUserId);
    await supabase.from("friends").delete().eq("user_id", targetUserId).eq("friend_id", user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { GardenGroup, GroupMember } from "@/lib/social/types";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, groups: [], members: [], storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) {
    return NextResponse.json({ ok: true, groups: [], members: [] });
  }

  const [{ data: groups }, { data: members }] = await Promise.all([
    supabase.from("garden_groups").select("*").in("id", groupIds),
    supabase.from("group_members").select("*").in("group_id", groupIds),
  ]);

  const mappedGroups: GardenGroup[] = (groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description ?? "",
    groupType: g.group_type,
    inviteCode: g.invite_code,
    ownerId: g.owner_id,
    totalPlants: g.total_plants ?? 0,
    memberCount: (members ?? []).filter((m) => m.group_id === g.id).length,
    createdAt: g.created_at,
  }));

  const mappedMembers: GroupMember[] = (members ?? []).map((m) => ({
    id: m.id,
    groupId: m.group_id,
    userId: m.user_id,
    role: m.role,
    displayName: m.display_name,
    avatar: m.avatar,
    joinedAt: m.joined_at,
  }));

  return NextResponse.json({ ok: true, groups: mappedGroups, members: mappedMembers });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action as string;

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

  if (action === "create") {
    const name = (body.name as string)?.trim() || "My Family Garden";
    const { data: group, error } = await supabase
      .from("garden_groups")
      .insert({
        name,
        description: (body.description as string) ?? "",
        group_type: (body.groupType as string) ?? "family",
        owner_id: user.id,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "owner",
      display_name: user.user_metadata?.full_name ?? "Owner",
    });

    return NextResponse.json({ ok: true, groupId: group.id, inviteCode: group.invite_code });
  }

  if (action === "join") {
    const inviteCode = (body.inviteCode as string)?.trim();
    if (!inviteCode) {
      return NextResponse.json({ ok: false, error: "inviteCode required" }, { status: 400 });
    }

    const { data: group } = await supabase
      .from("garden_groups")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();

    if (!group) {
      return NextResponse.json({ ok: false, error: "Invalid invite code" }, { status: 404 });
    }

    await supabase.from("group_members").upsert({
      group_id: group.id,
      user_id: user.id,
      role: "viewer",
      display_name: user.user_metadata?.full_name ?? "Member",
    });

    return NextResponse.json({ ok: true, groupId: group.id });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

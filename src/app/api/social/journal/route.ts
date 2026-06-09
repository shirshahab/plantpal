import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { FeedVisibility, PlantJournalEntry } from "@/lib/social/types";
import { EVENT_EMOJI } from "@/lib/social/constants";

export async function GET(request: Request) {
  const plantId = new URL(request.url).searchParams.get("plantId");
  if (!plantId) {
    return NextResponse.json({ ok: false, error: "plantId required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, entries: [], storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, entries: [] });
  }

  const { data } = await supabase
    .from("plant_journal_entries")
    .select("*")
    .eq("plant_id", plantId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const entries: PlantJournalEntry[] = (data ?? []).map((row) => ({
    id: row.id,
    plantId: row.plant_id,
    userId: row.user_id,
    entryType: row.entry_type,
    body: row.body ?? "",
    photoUrl: row.photo_url,
    milestoneType: row.milestone_type,
    visibility: row.visibility,
    feedEventId: row.feed_event_id,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ ok: true, entries });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const plantId = body.plantId as string;
  const entryType = body.entryType as PlantJournalEntry["entryType"];
  const text = (body.body as string)?.trim() ?? "";

  if (!plantId || !entryType) {
    return NextResponse.json({ ok: false, error: "plantId and entryType required" }, { status: 400 });
  }

  const visibility = (body.visibility as FeedVisibility) ?? "friends";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      id: crypto.randomUUID(),
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

  let feedEventId: string | null = null;

  if (visibility !== "private") {
    const eventType = entryType === "photo" ? "growth_photo" : "journal_entry";
    const title =
      entryType === "milestone"
        ? text || "logged a milestone"
        : entryType === "photo"
          ? "shared a growth photo"
          : text.slice(0, 80) || "added a journal note";

    const { data: feedRow } = await supabase
      .from("activity_feed")
      .insert({
        user_id: user.id,
        event_type: eventType,
        title,
        body: text,
        visibility,
        group_id: (body.groupId as string) ?? null,
        emoji: EVENT_EMOJI[eventType],
        payload: { plantId, entryType },
      })
      .select("id")
      .single();

    feedEventId = feedRow?.id ?? null;
  }

  const { data, error } = await supabase
    .from("plant_journal_entries")
    .insert({
      plant_id: plantId,
      user_id: user.id,
      entry_type: entryType,
      body: text,
      photo_url: (body.photoUrl as string) ?? null,
      milestone_type: (body.milestoneType as string) ?? null,
      visibility,
      feed_event_id: feedEventId,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.id, feedEventId });
}

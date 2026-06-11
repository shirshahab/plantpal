import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getCommunityAggregates,
  recordCommunitySignal,
} from "@/lib/intelligence/community-intelligence";
import type { CommunitySignalType } from "@/lib/intelligence/source-types";

const VALID_TYPES: CommunitySignalType[] = [
  "plant_added",
  "plant_scanned",
  "issue_detected",
  "care_plan_generated",
  "lesson_completed",
  "garden_design_created",
  "trend_viewed",
];

/** Record an anonymous aggregate signal. Requires a signed-in session. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, storage: "local" as const });
  }

  let body: {
    signal_type?: string;
    plant_species?: string;
    issue?: string;
    zip_code?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.signal_type || !VALID_TYPES.includes(body.signal_type as CommunitySignalType)) {
    return NextResponse.json({ ok: false, error: "Invalid signal_type" }, { status: 400 });
  }

  // Require a session so anonymous bots can't poison the aggregates,
  // but never store who sent the signal.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  const ok = await recordCommunitySignal({
    signalType: body.signal_type as CommunitySignalType,
    plantSpecies: body.plant_species,
    issue: body.issue,
    zipCode: body.zip_code,
  });

  return NextResponse.json({ ok });
}

/** Read aggregate signals (current week, optionally scoped by ZIP). */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, signals: [], storage: "local" as const });
  }
  const zip = new URL(request.url).searchParams.get("zip");
  const signals = await getCommunityAggregates(zip);
  return NextResponse.json({ ok: true, signals });
}

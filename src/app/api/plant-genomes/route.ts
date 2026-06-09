import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { genomeToDbPayload } from "@/lib/genome/sync";
import type { PlantGenomeState } from "@/lib/genome/types";

export async function POST(request: Request) {
  let body: { plantId?: string; genome?: PlantGenomeState };
  try {
    body = (await request.json()) as { plantId?: string; genome?: PlantGenomeState };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.plantId || !body.genome) {
    return NextResponse.json({ ok: false, error: "plantId and genome required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, storage: "local" as const });
  }

  const row = {
    ...genomeToDbPayload(body.plantId, body.genome),
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("plant_genomes").upsert(row, {
    onConflict: "plant_id",
  });

  if (error) {
    console.error("[plant-genomes]", error.message);
    return NextResponse.json({ ok: true, storage: "local" as const });
  }

  return NextResponse.json({ ok: true, storage: "supabase" as const });
}

export async function GET(request: Request) {
  const plantId = new URL(request.url).searchParams.get("plantId");
  if (!plantId) {
    return NextResponse.json({ ok: false, error: "plantId required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, genome: null, storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, genome: null, storage: "local" as const });
  }

  const { data, error } = await supabase
    .from("plant_genomes")
    .select("computed_state")
    .eq("plant_id", plantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data?.computed_state) {
    return NextResponse.json({ ok: true, genome: null, storage: "supabase" as const });
  }

  return NextResponse.json({
    ok: true,
    genome: data.computed_state as PlantGenomeState,
    storage: "supabase" as const,
  });
}

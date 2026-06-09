import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ConciergePlanData, SavedConciergePlan } from "@/lib/concierge/types";

interface DbRow {
  id: string;
  user_id: string;
  plant_id: string;
  title: string;
  issue: string;
  severity: string;
  plan: ConciergePlanData;
  status: SavedConciergePlan["status"];
  created_at: string;
  updated_at: string;
}

function rowToPlan(row: DbRow): SavedConciergePlan {
  return {
    id: row.id,
    plantId: row.plant_id,
    title: row.title,
    issue: row.issue,
    severity: row.severity as SavedConciergePlan["severity"],
    plan: row.plan,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  const plantId = new URL(request.url).searchParams.get("plantId");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, plans: [], storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, plans: [], storage: "local" as const });
  }

  let query = supabase
    .from("concierge_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (plantId) query = query.eq("plant_id", plantId);

  const { data, error } = await query;

  if (error) {
    console.error("[concierge-plans GET]", error.message);
    return NextResponse.json({ ok: true, plans: [], storage: "local" as const });
  }

  return NextResponse.json({
    ok: true,
    plans: ((data ?? []) as DbRow[]).map(rowToPlan),
    storage: "supabase" as const,
  });
}

export async function PATCH(request: Request) {
  let body: { id?: string; status?: SavedConciergePlan["status"] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.id || !body.status) {
    return NextResponse.json({ ok: false, error: "id and status required" }, { status: 400 });
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

  await supabase
    .from("concierge_plans")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, storage: "supabase" as const });
}

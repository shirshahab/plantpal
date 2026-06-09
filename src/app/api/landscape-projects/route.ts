import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { LandscapeDesignResponse, LandscapeProject } from "@/lib/landscape/types";
import { normalizeGardenStyle } from "@/lib/landscape/garden-styles";

interface DbRow {
  id: string;
  user_id: string;
  title: string;
  zip_code: string;
  space_type: LandscapeProject["spaceType"];
  style_goal: LandscapeProject["styleGoal"];
  budget_range: LandscapeProject["budgetRange"];
  photos: LandscapeProject["photos"];
  design_result: LandscapeDesignResponse & {
    sun_exposure?: LandscapeProject["sunExposure"];
    yard_size?: LandscapeProject["yardSize"];
    notes?: string;
    visual_concept_requested?: boolean;
  };
  created_at: string;
  updated_at: string;
}

function rowToProject(row: DbRow): LandscapeProject {
  const meta = row.design_result;
  const photo = row.photos[0]?.dataUrl ?? "";
  return {
    id: row.id,
    name: row.title,
    spaceType: row.space_type,
    zipCode: row.zip_code,
    sunExposure: meta.sun_exposure ?? "mixed",
    yardSize: meta.yard_size ?? "unknown",
    budgetRange: row.budget_range,
    notes: meta.notes ?? "",
    photos: row.photos,
    design: {
      analysis: meta.analysis,
      climate: meta.climate,
      recommendations: meta.recommendations,
      irrigation: meta.irrigation,
      soil_prep: meta.soil_prep,
      maintenance_level: meta.maintenance_level,
      maintenance_notes: meta.maintenance_notes,
      maintenance_score: meta.maintenance_score ?? 65,
      estimated_budget: meta.estimated_budget,
      first_steps: meta.first_steps,
      budget_options: meta.budget_options,
      design_summary: meta.design_summary,
      layout_suggestions: meta.layout_suggestions ?? [],
      phased_plan: meta.phased_plan ?? [],
      after_concept: meta.after_concept,
      after_image_url: meta.after_image_url ?? null,
      plant_list: meta.plant_list ?? [],
      source: meta.source,
    },
    visualConceptRequested: meta.visual_concept_requested ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photoDataUrl: photo,
    styleGoal: normalizeGardenStyle(row.style_goal),
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, projects: [], storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, projects: [], storage: "local" as const });
  }

  const { data, error } = await supabase
    .from("landscape_projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[landscape-projects GET]", error.message);
    return NextResponse.json({ ok: true, projects: [], storage: "local" as const });
  }

  const projects = ((data ?? []) as DbRow[]).map(rowToProject);
  return NextResponse.json({ ok: true, projects, storage: "supabase" as const });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const project = body.project as LandscapeProject | undefined;
  if (!project?.name || !project.design) {
    return NextResponse.json({ ok: false, error: "project is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, storage: "local" as const, id: project.id });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, storage: "local" as const, id: project.id });
  }

  const designResult = {
    ...project.design,
    sun_exposure: project.sunExposure,
    yard_size: project.yardSize,
    notes: project.notes,
    visual_concept_requested: project.visualConceptRequested,
  };

  const row = {
    id: project.id,
    user_id: user.id,
    title: project.name,
    zip_code: project.zipCode,
    space_type: project.spaceType,
    style_goal: project.styleGoal,
    budget_range: project.budgetRange,
    photos: project.photos.length
      ? project.photos
      : [{ dataUrl: project.photoDataUrl, label: "Primary" }],
    design_result: designResult,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("landscape_projects")
    .upsert(row, { onConflict: "id" })
    .select("id")
    .single();

  if (error) {
    console.error("[landscape-projects POST]", error.message);
    return NextResponse.json({ ok: true, storage: "local" as const, id: project.id });
  }

  return NextResponse.json({
    ok: true,
    storage: "supabase" as const,
    id: data.id as string,
  });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
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

  const { error } = await supabase
    .from("landscape_projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[landscape-projects DELETE]", error.message);
  }

  return NextResponse.json({ ok: true, storage: "supabase" as const });
}

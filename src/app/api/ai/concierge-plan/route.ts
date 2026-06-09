import {
  aiError,
  aiSuccess,
  getAuthUserId,
  optionalString,
  requireString,
  stringArray,
} from "@/lib/ai/route-utils";
import { generateConciergePlan } from "@/lib/ai/concierge-plan";
import { planTitle } from "@/lib/concierge/mock-plan";
import type { ConciergePlanRequest } from "@/lib/concierge/types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return aiError("Invalid JSON body");
  }

  const plantId = requireString(body, "plantId");
  const nickname = requireString(body, "nickname");
  const species = requireString(body, "species");
  const issue = requireString(body, "issue");

  if (!plantId || !nickname || !species || !issue) {
    return aiError("plantId, nickname, species, and issue are required");
  }

  const input: ConciergePlanRequest = {
    plantId,
    nickname,
    species,
    issue,
    zipCode: optionalString(body, "zipCode") ?? "00000",
    locationType: (optionalString(body, "locationType") ?? "outdoor") as ConciergePlanRequest["locationType"],
    healthStatus: (optionalString(body, "healthStatus") ?? "healthy") as ConciergePlanRequest["healthStatus"],
    healthNotes: optionalString(body, "healthNotes"),
    goals: stringArray(body, "goals"),
    primaryGoal: optionalString(body, "primaryGoal"),
    imageDataUrl: optionalString(body, "imageDataUrl"),
    lastWateredAt: optionalString(body, "lastWateredAt") ?? null,
    lastFertilizedAt: optionalString(body, "lastFertilizedAt") ?? null,
    tasksCompleted:
      typeof body.tasksCompleted === "number" ? body.tasksCompleted : undefined,
    healthScanCount:
      typeof body.healthScanCount === "number" ? body.healthScanCount : undefined,
    careHistorySummary: optionalString(body, "careHistorySummary"),
  };

  try {
    const plan = await generateConciergePlan(input);
    const title = planTitle(plan, nickname);

    let saved = false;
    const userId = await getAuthUserId();
    if (userId && isSupabaseConfigured()) {
      const supabase = await createClient();
      const { error } = await supabase.from("concierge_plans").insert({
        user_id: userId,
        plant_id: plantId,
        title,
        issue,
        severity: plan.severity,
        plan,
        status: "active",
      });
      saved = !error;
      if (error) console.error("[concierge-plan]", error.message);
    }

    return aiSuccess({ ...plan, title }, saved);
  } catch (e) {
    return aiError(e instanceof Error ? e.message : "Concierge plan failed", 500);
  }
}

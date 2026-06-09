import { generateGoalPlan } from "@/lib/ai/plant-goals";
import { saveGoalPlan } from "@/lib/ai/persist";
import {
  aiError,
  aiSuccess,
  getAuthUserId,
  optionalString,
  requireString,
  stringArray,
} from "@/lib/ai/route-utils";
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

  if (!plantId || !nickname || !species) {
    return aiError("plantId, nickname, and species are required");
  }

  const goals = stringArray(body, "goals");
  if (goals.length === 0) {
    return aiError("At least one goal is required");
  }

  try {
    const plan = await generateGoalPlan({
      plantId,
      nickname,
      species,
      zipCode: optionalString(body, "zipCode") ?? "00000",
      healthStatus:
        (optionalString(body, "healthStatus") as "healthy" | "needs_attention" | "critical") ??
        "healthy",
      healthNotes: optionalString(body, "healthNotes"),
      goals,
      primaryGoal: optionalString(body, "primaryGoal"),
      createdAt: optionalString(body, "createdAt") ?? new Date().toISOString(),
    });

    let saved = false;
    const userId = await getAuthUserId();
    if (userId && isSupabaseConfigured()) {
      const supabase = await createClient();
      saved = await saveGoalPlan(supabase, userId, plantId, plan);
    }

    return aiSuccess(plan, saved);
  } catch (e) {
    return aiError(e instanceof Error ? e.message : "Goal plan generation failed", 500);
  }
}

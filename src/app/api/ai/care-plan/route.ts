import { generatePlantCarePlan } from "@/lib/ai/plant-care";
import { saveCarePlan } from "@/lib/ai/persist";
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
  const zipCode = requireString(body, "zipCode");

  if (!plantId || !nickname || !species || !zipCode) {
    return aiError("plantId, nickname, species, and zipCode are required");
  }

  const locationType = requireString(body, "locationType");
  const plantingType = requireString(body, "plantingType");
  const sunExposure = requireString(body, "sunExposure");
  const healthStatus = requireString(body, "healthStatus");

  if (!locationType || !plantingType || !sunExposure || !healthStatus) {
    return aiError("locationType, plantingType, sunExposure, and healthStatus are required");
  }

  try {
    const plan = await generatePlantCarePlan({
      plantId,
      nickname,
      species,
      zipCode,
      locationType: locationType as "indoor" | "outdoor",
      plantingType: plantingType as "pot" | "ground",
      sunExposure: sunExposure as "full_sun" | "partial_sun" | "shade",
      healthStatus: healthStatus as "healthy" | "needs_attention" | "critical",
      healthNotes: optionalString(body, "healthNotes"),
      goals: stringArray(body, "goals"),
      primaryGoal: optionalString(body, "primaryGoal"),
      season: optionalString(body, "season"),
    });

    let saved = false;
    const userId = await getAuthUserId();
    if (userId && isSupabaseConfigured()) {
      const supabase = await createClient();
      saved = await saveCarePlan(supabase, userId, plantId, plan);
    }

    return aiSuccess(plan, saved);
  } catch (e) {
    return aiError(e instanceof Error ? e.message : "Care plan generation failed", 500);
  }
}

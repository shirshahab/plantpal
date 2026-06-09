import { generateDoctorDiagnosis } from "@/lib/ai/plant-doctor";
import { saveDoctorReport } from "@/lib/ai/persist";
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
  const issue = requireString(body, "issue");

  if (!plantId || !nickname || !species || !issue) {
    return aiError("plantId, nickname, species, and issue are required");
  }

  const zipCode = optionalString(body, "zipCode") ?? "00000";
  const locationType = optionalString(body, "locationType") ?? "outdoor";
  const healthStatus = optionalString(body, "healthStatus") ?? "healthy";

  try {
    const report = await generateDoctorDiagnosis({
      plantId,
      nickname,
      species,
      zipCode,
      locationType: locationType as "indoor" | "outdoor",
      healthStatus: healthStatus as "healthy" | "needs_attention" | "critical",
      healthNotes: optionalString(body, "healthNotes"),
      goals: stringArray(body, "goals"),
      primaryGoal: optionalString(body, "primaryGoal"),
      issue,
    });

    let saved = false;
    const userId = await getAuthUserId();
    if (userId && isSupabaseConfigured()) {
      const supabase = await createClient();
      saved = await saveDoctorReport(
        supabase,
        userId,
        plantId,
        optionalString(body, "photoUrl") ?? "",
        report
      );
    }

    return aiSuccess(report, saved);
  } catch (e) {
    return aiError(e instanceof Error ? e.message : "Diagnosis failed", 500);
  }
}

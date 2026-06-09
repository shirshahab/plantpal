import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AICarePlanResponse,
  AIDoctorResponse,
  AIGoalPlanResponse,
} from "@/lib/types/ai";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function saveCarePlan(
  supabase: SupabaseClient,
  userId: string,
  plantId: string,
  plan: AICarePlanResponse
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase.from("care_schedules").upsert(
    {
      user_id: userId,
      plant_id: plantId,
      watering_instructions: plan.watering_schedule,
      fertilizing_instructions: plan.fertilizer_schedule,
      pruning_instructions: plan.pruning_schedule,
      ai_generated_data: plan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "plant_id" }
  );

  return !error;
}

export async function saveDoctorReport(
  supabase: SupabaseClient,
  userId: string,
  plantId: string,
  photoUrl: string,
  report: AIDoctorResponse
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase.from("health_reports").insert({
    user_id: userId,
    plant_id: plantId,
    photo_url: photoUrl || "https://plantpal.local/no-photo",
    issues: [report],
    overall_health: report.severity,
  });

  return !error;
}

export async function saveGoalPlan(
  supabase: SupabaseClient,
  userId: string,
  plantId: string,
  plan: AIGoalPlanResponse
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const season =
    plan.missions[0]?.season ??
    (() => {
      const m = new Date().getMonth();
      if (m >= 2 && m <= 4) return "spring";
      if (m >= 5 && m <= 7) return "summer";
      if (m >= 8 && m <= 10) return "fall";
      return "winter";
    })();

  await supabase
    .from("plant_milestones")
    .delete()
    .eq("plant_id", plantId)
    .eq("user_id", userId)
    .eq("status", "upcoming");

  const { error: msError } = await supabase.from("plant_milestones").insert({
    user_id: userId,
    plant_id: plantId,
    title: plan.next_milestone.title,
    description: plan.next_milestone.description,
    target_date: null,
    status: "in_progress",
  });

  if (msError) return false;

  await supabase
    .from("plant_missions")
    .delete()
    .eq("plant_id", plantId)
    .eq("user_id", userId)
    .eq("status", "active");

  if (plan.missions.length === 0) return true;

  const { error: missionError } = await supabase.from("plant_missions").insert(
    plan.missions.map((m) => ({
      user_id: userId,
      plant_id: plantId,
      title: m.title,
      description: m.description,
      season: m.season || season,
      task_type: m.task_type,
      reward_points: 10,
      status: "active",
    }))
  );

  return !missionError;
}

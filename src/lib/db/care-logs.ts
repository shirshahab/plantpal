import type { PlantCareLog, TaskType } from "@/lib/types/tasks";
import type { DbClient } from "./client";
import { safeDb } from "./client";

export interface DbCareLog {
  id: string;
  user_id: string;
  plant_id: string;
  action_type: string;
  notes: string;
  photo_url: string | null;
  created_at: string;
}

function mapLog(row: DbCareLog): PlantCareLog {
  return {
    id: row.id,
    plantId: row.plant_id,
    actionType: row.action_type,
    notes: row.notes,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
  };
}

export async function getCareLogs(
  db: DbClient,
  userId: string,
  plantId?: string
): Promise<PlantCareLog[]> {
  const { data } = await safeDb(async () => {
    let q = db
      .from("plant_care_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (plantId) q = q.eq("plant_id", plantId);
    const res = await q;
    return { data: (res.data ?? []) as DbCareLog[], error: res.error };
  });
  return (data ?? []).map(mapLog);
}

export async function createCareLog(
  db: DbClient,
  userId: string,
  input: {
    plantId: string;
    actionType: TaskType | string;
    notes: string;
    photoUrl?: string | null;
  }
): Promise<{ log: PlantCareLog | null; error: string | null }> {
  const { data, error } = await safeDb(async () => {
    const res = await db
      .from("plant_care_logs")
      .insert({
        user_id: userId,
        plant_id: input.plantId,
        action_type: input.actionType,
        notes: input.notes,
        photo_url: input.photoUrl ?? null,
      })
      .select()
      .single();
    return { data: res.data as DbCareLog | null, error: res.error };
  });

  if (error || !data) return { log: null, error };
  return { log: mapLog(data), error: null };
}

/**
 * One-time migration: push localStorage data to Supabase when a user signs
 * in and their cloud account is empty. After success, clears local duplicates
 * so Supabase becomes the source of truth.
 *
 * Runs once per user (tracked by plantpal-cloud-migrated-{userId}).
 */

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapPlantInputToDb, withPlantDefaults } from "@/lib/supabase/mappers";
import type { Plant } from "@/lib/types";

const MIGRATION_FLAG = (userId: string) => `plantpal-cloud-migrated-${userId}`;

/** Keys cleared after successful cloud migration. */
const MIGRATE_THEN_CLEAR = [
  "plantpal-plants",
  "plantpal-task-states",
  "plantpal-care-logs",
  "plantpal-photo-history",
  "plantpal-health-reports",
  "plantpal-scan-history",
  "plantpal-social-friends",
  "plantpal-social-requests",
] as const;

export interface MigrationResult {
  ran: boolean;
  plantsMigrated: number;
  tasksMigrated: number;
  careLogsMigrated: number;
  error?: string;
}

function readLocalPlants(): Plant[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("plantpal-plants");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<Plant>[];
    return Array.isArray(parsed) ? parsed.map((p) => withPlantDefaults(p as Plant)) : [];
  } catch {
    return [];
  }
}

/**
 * Migrate local plants/tasks/logs to Supabase if cloud is empty and local
 * has real data. Idempotent per user.
 */
export async function migrateLocalDataToCloud(userId: string): Promise<MigrationResult> {
  if (!isSupabaseConfigured() || typeof window === "undefined") {
    return { ran: false, plantsMigrated: 0, tasksMigrated: 0, careLogsMigrated: 0 };
  }

  if (localStorage.getItem(MIGRATION_FLAG(userId)) === "1") {
    return { ran: false, plantsMigrated: 0, tasksMigrated: 0, careLogsMigrated: 0 };
  }

  const supabase = createClient();
  let plantsMigrated = 0;
  let tasksMigrated = 0;
  let careLogsMigrated = 0;

  try {
    const { count: cloudPlantCount } = await supabase
      .from("plants")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const localPlants = readLocalPlants();

    if ((cloudPlantCount ?? 0) === 0 && localPlants.length > 0) {
      for (const plant of localPlants) {
        const row = mapPlantInputToDb(
          {
            name: plant.name,
            species: plant.species,
            image: plant.image,
            locationType: plant.locationType,
            plantingType: plant.plantingType,
            zipCode: plant.zipCode,
            sunExposure: plant.sunExposure,
            photoStatus: plant.photoStatus,
          },
          userId,
          {
            waterFrequencyDays: plant.waterFrequencyDays ?? 7,
            fertilizeFrequencyWeeks: plant.fertilizeFrequencyWeeks ?? 4,
            pruneSchedule: plant.pruneSchedule ?? "as needed",
          }
        );
        const { data, error } = await supabase
          .from("plants")
          .insert({ ...row, id: plant.id })
          .select("*")
          .single();
        if (!error && data) plantsMigrated += 1;
      }
    }

    const taskStatesRaw = localStorage.getItem("plantpal-task-states");
    if (taskStatesRaw) {
      const states = JSON.parse(taskStatesRaw) as Record<
        string,
        { status: string; completedAt?: string; snoozedUntil?: string }
      >;
      const { count: cloudTaskCount } = await supabase
        .from("plant_tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if ((cloudTaskCount ?? 0) === 0 && Object.keys(states).length > 0) {
        for (const [taskKey, state] of Object.entries(states)) {
          if (state.status === "completed" && state.completedAt) {
            await supabase.from("plant_tasks").upsert(
              {
                user_id: userId,
                task_key: taskKey,
                title: taskKey,
                task_type: "inspect",
                due_date: state.completedAt.slice(0, 10),
                completed_at: state.completedAt,
                source: "manual",
              },
              { onConflict: "user_id,task_key" }
            );
            tasksMigrated += 1;
          }
        }
      }
    }

    const careLogsRaw = localStorage.getItem("plantpal-care-logs");
    if (careLogsRaw) {
      const logs = JSON.parse(careLogsRaw) as {
        plantId: string;
        actionType: string;
        notes: string;
        createdAt: string;
      }[];
      const { count: cloudLogCount } = await supabase
        .from("plant_care_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if ((cloudLogCount ?? 0) === 0 && Array.isArray(logs) && logs.length > 0) {
        for (const log of logs.slice(0, 100)) {
          await supabase.from("plant_care_logs").insert({
            user_id: userId,
            plant_id: log.plantId,
            action_type: log.actionType,
            notes: log.notes,
            created_at: log.createdAt,
          });
          careLogsMigrated += 1;
        }
      }
    }

    if (plantsMigrated > 0 || tasksMigrated > 0 || careLogsMigrated > 0) {
      for (const key of MIGRATE_THEN_CLEAR) {
        localStorage.removeItem(key);
      }
    }

    localStorage.setItem(MIGRATION_FLAG(userId), "1");
    return { ran: true, plantsMigrated, tasksMigrated, careLogsMigrated };
  } catch (err) {
    return {
      ran: true,
      plantsMigrated,
      tasksMigrated,
      careLogsMigrated,
      error: err instanceof Error ? err.message : "Migration failed",
    };
  }
}

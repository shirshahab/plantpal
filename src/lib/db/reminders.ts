import type { ReminderSettings } from "@/lib/types/tasks";
import { DEFAULT_REMINDER_SETTINGS } from "@/lib/types/tasks";
import type { DbClient } from "./client";
import { safeDb } from "./client";

export interface DbReminderSettings {
  id: string;
  user_id: string;
  reminder_time: string;
  watering_enabled: boolean;
  fertilizer_enabled: boolean;
  health_check_enabled: boolean;
  growth_photo_enabled: boolean;
  mission_enabled: boolean;
  push_enabled: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export function mapReminderRow(row: DbReminderSettings): ReminderSettings {
  return {
    reminderTime: row.reminder_time,
    watering: row.watering_enabled,
    fertilizer: row.fertilizer_enabled,
    healthCheck: row.health_check_enabled,
    growthPhoto: row.growth_photo_enabled,
    missions: row.mission_enabled,
    notificationsEnabled: row.push_enabled,
    notificationPermission: "default",
  };
}

export function reminderToRow(
  userId: string,
  settings: ReminderSettings,
  timezone: string
): Omit<DbReminderSettings, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    reminder_time: settings.reminderTime,
    watering_enabled: settings.watering,
    fertilizer_enabled: settings.fertilizer,
    health_check_enabled: settings.healthCheck,
    growth_photo_enabled: settings.growthPhoto,
    mission_enabled: settings.missions,
    push_enabled: settings.notificationsEnabled,
    timezone,
  };
}

export async function getReminderSettings(
  db: DbClient,
  userId: string
): Promise<ReminderSettings | null> {
  const { data } = await safeDb(async () => {
    const res = await db
      .from("user_reminder_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return { data: res.data as DbReminderSettings | null, error: res.error };
  });

  if (!data) return null;
  return mapReminderRow(data);
}

export async function updateReminderSettings(
  db: DbClient,
  userId: string,
  settings: ReminderSettings,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
): Promise<string | null> {
  const row = {
    ...reminderToRow(userId, settings, timezone),
    updated_at: new Date().toISOString(),
  };

  const { error } = await db.from("user_reminder_settings").upsert(row, {
    onConflict: "user_id",
  });

  return error?.message ?? null;
}

export function getDefaultReminders(): ReminderSettings {
  return { ...DEFAULT_REMINDER_SETTINGS };
}

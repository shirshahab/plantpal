import type { XpEventType } from "./types";

export const XP_REWARDS: Record<XpEventType, number> = {
  lesson_completed: 25,
  quiz_passed: 50,
  plant_added: 10,
  plant_healthy_30d: 50,
  growth_photo: 10,
  diagnosis_completed: 15,
  daily_login: 5,
  task_completed: 5,
  price_check_completed: 10,
  daily_mission_completed: 20,
  weekly_mission_completed: 75,
  family_challenge_completed: 150,
  seasonal_task_completed: 10,
  garden_map_updated: 15,
};

/** XP events not yet wired in app code — see ACADEMY_SYNC_PLAN.md */
export const XP_PENDING_EVENTS: XpEventType[] = ["plant_healthy_30d"];

export function xpForEvent(type: XpEventType): number {
  return XP_REWARDS[type];
}

/** Level = floor(totalXp / 100) + 1 */
export function xpToLevel(totalXp: number): number {
  return Math.floor(totalXp / 100) + 1;
}

export function xpProgressInLevel(totalXp: number): {
  level: number;
  current: number;
  needed: number;
  percent: number;
} {
  const level = xpToLevel(totalXp);
  const base = (level - 1) * 100;
  const current = totalXp - base;
  return {
    level,
    current,
    needed: 100,
    percent: Math.min(100, Math.round((current / 100) * 100)),
  };
}

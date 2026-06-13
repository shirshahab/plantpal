import type { Plant } from "@/lib/types";
import type { PlantTask, TaskStateRecord } from "@/lib/types/tasks";

export const WEEKLY_CHECKLIST = [
  "Check leaves for yellowing",
  "Check under leaves for pests",
  "Check soil moisture",
  "Look for spots or damage",
  "Take a progress photo",
  "Add note, optional",
] as const;

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday-start week key for stable weekly task IDs. */
export function weekStartKey(d: Date): string {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return dateKey(x);
}

export function weeklyCheckTaskId(plantId: string, weekKey: string): string {
  return `weekly-check-${plantId}-${weekKey}`;
}

export function isWeeklyCheckSnoozed(
  taskId: string,
  taskStates: Record<string, TaskStateRecord>,
  today: Date
): boolean {
  const state = taskStates[taskId];
  if (state?.status !== "snoozed" || !state.snoozedUntil) return false;
  return new Date(state.snoozedUntil) > today;
}

export function shouldGenerateWeeklyCheck(
  plant: Plant,
  taskStates: Record<string, TaskStateRecord>,
  today: Date
): boolean {
  const weekKey = weekStartKey(today);
  const id = weeklyCheckTaskId(plant.id, weekKey);
  const state = taskStates[id];
  if (state?.status === "completed") return false;
  if (isWeeklyCheckSnoozed(id, taskStates, today)) return false;
  return true;
}

export function generateWeeklyCheckTask(
  plant: Plant,
  today: Date
): Omit<PlantTask, "status" | "completedAt"> {
  const weekKey = weekStartKey(today);
  const name = plant.name;
  return {
    id: weeklyCheckTaskId(plant.id, weekKey),
    plantId: plant.id,
    plantName: name,
    title: `Weekly check for ${name}`,
    description:
      "Look for pests, yellow leaves, dry soil, weird spots, and general plant drama.",
    taskType: "weekly_check",
    priority: "medium",
    dueDate: dateKey(today),
    source: "care_schedule",
    whyItMatters: "One weekly pass catches most problems before they get dramatic.",
    metadata: {
      checklist: [...WEEKLY_CHECKLIST],
      weekKey,
    },
  };
}

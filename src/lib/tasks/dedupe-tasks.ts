import type { Plant } from "@/lib/types";
import type { PlantTask, TaskGroups, TaskPriority, TaskType } from "@/lib/types/tasks";
import { isRecoveryTask } from "@/lib/health/recovery-tasks";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** Lower = shown first on Today. */
const TYPE_RANK: Partial<Record<TaskType, number>> = {
  water: 1,
  scan: 2,
  weekly_check: 3,
  fertilize: 4,
  complete_lesson: 5,
  prune: 6,
  repot: 7,
  harvest: 8,
  take_growth_photo: 9,
  inspect: 10,
};

function typeRank(task: PlantTask): number {
  return TYPE_RANK[task.taskType] ?? 20;
}

function taskScore(task: PlantTask): number {
  return PRIORITY_RANK[task.priority] * 100 + typeRank(task);
}

function normalizeTaskType(task: PlantTask): TaskType {
  if (task.taskType === "inspect" && task.source !== "weather") return "weekly_check";
  if (
    task.taskType === "scan" &&
    task.priority !== "urgent" &&
    task.source === "care_schedule"
  ) {
    return "weekly_check";
  }
  return task.taskType;
}

/** Max actionable items on Today — hard ceiling, not a suggestion. */
export function todayTaskLimit(plantCount: number): number {
  if (plantCount <= 1) return 2;
  if (plantCount <= 3) return 3;
  if (plantCount <= 5) return 4;
  return 5;
}

const MAX_RECOVERY_ON_TODAY = 1;
const MAX_WEATHER_ON_TODAY = 1;

function isLowNoiseCandidate(task: PlantTask, plantCount: number): boolean {
  if (task.source === "goal_mission") return false;
  if (task.taskType === "take_growth_photo" && task.source !== "manual") return false;
  if (plantCount <= 3 && task.taskType === "complete_lesson") return false;
  if (task.source === "ai_plan") return false;
  return true;
}

/**
 * Collapse duplicate care tasks and cap Today volume by garden size.
 * Returns the smallest set that still covers real needs.
 */
export function dedupeTodayTasks(tasks: PlantTask[], plants: Plant[]): PlantTask[] {
  const plantCount = Math.max(1, plants.length);
  const limit = todayTaskLimit(plantCount);

  const normalized = tasks.map((t) => {
    const nextType = normalizeTaskType(t);
    if (nextType === t.taskType) return t;
    return { ...t, taskType: nextType };
  });

  const sorted = [...normalized].sort((a, b) => taskScore(a) - taskScore(b));
  const kept: PlantTask[] = [];
  const plantTypeSeen = new Set<string>();
  let recoveryCount = 0;
  let weatherCount = 0;

  for (const task of sorted) {
    if (!isLowNoiseCandidate(task, plantCount)) continue;

    if (isRecoveryTask(task)) {
      if (recoveryCount >= MAX_RECOVERY_ON_TODAY) continue;
      recoveryCount++;
      kept.push(task);
      continue;
    }

    if (task.source === "weather") {
      if (weatherCount >= MAX_WEATHER_ON_TODAY) continue;
      weatherCount++;
      kept.push(task);
      continue;
    }

    const type = task.taskType;

    if (type === "complete_lesson") {
      if (kept.some((t) => t.taskType === "complete_lesson")) continue;
      kept.push(task);
      continue;
    }

    if (task.plantId) {
      const key = `${task.plantId}:${type}`;
      if (
        type === "water" ||
        type === "fertilize" ||
        type === "weekly_check" ||
        type === "scan"
      ) {
        if (plantTypeSeen.has(key)) continue;
        plantTypeSeen.add(key);
      }
    }

    kept.push(task);
  }

  return kept.sort((a, b) => taskScore(a) - taskScore(b)).slice(0, limit);
}

/** Overdue + due today, capped — the only list the Today page should render. */
export function getTodayFocusTasks(groups: TaskGroups, plants: Plant[]): PlantTask[] {
  const candidates = [...groups.overdue, ...groups.dueToday];
  return dedupeTodayTasks(candidates, plants);
}

/** One-line preview for calendar / dashboard — not a second task list. */
export function getUpcomingPreview(groups: TaskGroups, max = 1): PlantTask[] {
  return groups.upcoming.filter((t) => !isRecoveryTask(t)).slice(0, max);
}

export function todayFocusCopy(count: number): string {
  if (count === 0) return "Nothing urgent today.";
  if (count === 1) return "One thing that matters today.";
  return `${count} things that matter today.`;
}

export { pickPlantyMessage } from "@/lib/copy/planty-messages-system";

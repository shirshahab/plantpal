/**
 * Grouped, capped task view for the dashboard.
 *
 * PlantPal simplifies gardening — it does not create work. Instead of a wall
 * of individual tasks, the dashboard shows a handful of grouped categories
 * ("Water Garden — 2 plants need water") plus a short "Upcoming" preview.
 *
 * Visible group caps:
 *   0 plants  → nothing (onboarding handles it)
 *   1–3       → max 3 groups
 *   4–10      → max 5 groups
 *   10+       → grouped by category ("Water 7 Plants")
 */
import type {
  PlantTask,
  TaskGroups,
  TaskPriority,
  TaskType,
} from "@/lib/types/tasks";
import { parseDateKey } from "./task-engine";

export type TaskGroupKey =
  | "water"
  | "health"
  | "fertilize"
  | "prune"
  | "repot"
  | "photo"
  | "harvest"
  | "other";

export interface TaskGroupSummary {
  key: TaskGroupKey;
  title: string;
  subtitle: string;
  tasks: PlantTask[];
  priority: TaskPriority;
}

export interface UpcomingPreview {
  label: string;
  dueDate: string;
}

export interface GardenTaskView {
  groups: TaskGroupSummary[];
  upcoming: UpcomingPreview[];
  /** Active (overdue + due today) tasks not shown in visible groups. */
  hiddenCount: number;
  totalActive: number;
}

const GROUP_OF_TYPE: Record<TaskType, TaskGroupKey> = {
  water: "water",
  fertilize: "fertilize",
  prune: "prune",
  repot: "repot",
  inspect: "health",
  scan: "health",
  take_growth_photo: "photo",
  harvest: "harvest",
  complete_lesson: "other",
};

const GROUP_ORDER: TaskGroupKey[] = [
  "water",
  "health",
  "harvest",
  "fertilize",
  "prune",
  "repot",
  "photo",
  "other",
];

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function plantCountIn(tasks: PlantTask[]): number {
  return new Set(tasks.map((t) => t.plantId ?? t.id)).size;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function groupCopy(
  key: TaskGroupKey,
  tasks: PlantTask[],
  manyPlants: boolean
): { title: string; subtitle: string } {
  const n = plantCountIn(tasks);
  switch (key) {
    case "water":
      return {
        title: manyPlants ? `Water ${n} Plants` : "Water Garden",
        subtitle: `${plural(n, "plant")} need${n === 1 ? "s" : ""} water.`,
      };
    case "health":
      return {
        title: manyPlants ? `Health Check ${n} Plants` : "Health Check",
        subtitle: `${plural(n, "plant")} could use a quick look.`,
      };
    case "fertilize":
      return {
        title: manyPlants ? `Fertilize ${n} Plants` : "Fertilize",
        subtitle: `${plural(n, "plant")} due for feeding.`,
      };
    case "prune":
      return {
        title: manyPlants ? `Prune ${n} Plants` : "Prune",
        subtitle: `${plural(n, "plant")} ready for a trim.`,
      };
    case "repot":
      return {
        title: "Repot",
        subtitle: `${plural(n, "plant")} ready for a bigger home.`,
      };
    case "photo":
      return {
        title: "Photos",
        subtitle: `${plural(n, "plant")} could use a photo.`,
      };
    case "harvest":
      return {
        title: "Harvest",
        subtitle: `${plural(n, "plant")} ready to harvest.`,
      };
    default:
      return {
        title: tasks.length === 1 ? tasks[0].title : "Garden To-Dos",
        subtitle:
          tasks.length === 1
            ? tasks[0].description
            : `${plural(tasks.length, "small task")} for today.`,
      };
  }
}

function relativeLabel(dueDate: string, today: Date): string {
  const due = parseDateKey(dueDate);
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - start.getTime()) / 86_400_000);
  if (days <= 1) return "tomorrow";
  if (days < 14) return `in ${days} days`;
  return `in ${Math.round(days / 7)} weeks`;
}

function upcomingVerb(type: TaskType): string | null {
  switch (type) {
    case "fertilize":
      return "Fertilize";
    case "prune":
      return "Prune";
    case "repot":
      return "Repot";
    case "water":
      return "Water";
    case "harvest":
      return "Harvest";
    default:
      return null;
  }
}

export function buildGardenTaskView(
  groups: TaskGroups,
  plantCount: number,
  today = new Date()
): GardenTaskView {
  if (plantCount === 0) {
    return { groups: [], upcoming: [], hiddenCount: 0, totalActive: 0 };
  }

  // Lessons have their own dashboard card — never count them as garden work.
  const active = [...groups.overdue, ...groups.dueToday].filter(
    (t) => t.taskType !== "complete_lesson"
  );

  const buckets = new Map<TaskGroupKey, PlantTask[]>();
  for (const task of active) {
    const key = GROUP_OF_TYPE[task.taskType] ?? "other";
    const list = buckets.get(key) ?? [];
    list.push(task);
    buckets.set(key, list);
  }

  const manyPlants = plantCount > 10;
  const summaries: TaskGroupSummary[] = [];
  for (const key of GROUP_ORDER) {
    const tasks = buckets.get(key);
    if (!tasks?.length) continue;
    const priority = tasks.reduce<TaskPriority>(
      (best, t) => (PRIORITY_RANK[t.priority] < PRIORITY_RANK[best] ? t.priority : best),
      "low"
    );
    summaries.push({
      key,
      ...groupCopy(key, tasks, manyPlants),
      tasks,
      priority,
    });
  }
  summaries.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

  const maxGroups = plantCount <= 3 ? 3 : plantCount <= 10 ? 5 : 6;
  const visible = summaries.slice(0, maxGroups);
  const hiddenCount = summaries
    .slice(maxGroups)
    .reduce((sum, g) => sum + g.tasks.length, 0);

  // Short "Upcoming" preview, e.g. "Fertilize in 5 weeks."
  const upcoming: UpcomingPreview[] = [];
  const seenVerbs = new Set<string>();
  const sortedUpcoming = [...groups.upcoming].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  for (const task of sortedUpcoming) {
    const verb = upcomingVerb(task.taskType);
    if (!verb || seenVerbs.has(verb)) continue;
    seenVerbs.add(verb);
    upcoming.push({
      label: `${verb} ${relativeLabel(task.dueDate, today)}.`,
      dueDate: task.dueDate,
    });
    if (upcoming.length >= 2) break;
  }

  return {
    groups: visible,
    upcoming,
    hiddenCount,
    totalActive: active.length,
  };
}

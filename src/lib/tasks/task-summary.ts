/**
 * Grouped, capped task view for the dashboard.
 *
 * PlantPal simplifies gardening, it does not create work. Instead of a wall
 * of individual tasks, the dashboard shows a handful of grouped categories
 * ("Water Bougainvillea", "Water 3 Plants") plus a short "Upcoming" preview.
 *
 * Counting rules:
 *   - Only distinct real plantIds count as plants. Garden-level tasks
 *     (weather/seasonal, plantId: null) get "Garden ..." labels instead.
 *   - Counts are clamped to the user's actual plant count.
 *
 * Visible group caps:
 *   0 plants  → nothing (onboarding handles it)
 *   1–3       → max 3 groups
 *   4–10      → max 5 groups
 *   10+       → max 6 groups
 */
import type {
  PlantTask,
  TaskGroups,
  TaskPriority,
  TaskType,
} from "@/lib/types/tasks";
import { parseDateKey } from "./task-engine";
import { isRecoveryTask } from "@/lib/health/recovery-tasks";

export type TaskGroupKey =
  | "recovery"
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
  "recovery",
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

/**
 * Count distinct REAL plants in a task list. Garden-level tasks
 * (weather, seasonal — plantId: null) must never count as plants:
 * that's how "1 plant" turned into "3 plants need a look".
 */
function plantCountIn(tasks: PlantTask[], maxPlants: number): number {
  const ids = new Set<string>();
  for (const t of tasks) {
    if (t.plantId) ids.add(t.plantId);
  }
  // Hard guard: never claim more plants than the user actually has.
  return Math.min(ids.size, maxPlants);
}

/** Name of the first real plant in the group, for single-plant labels. */
function firstPlantName(tasks: PlantTask[]): string {
  const named = tasks.find((t) => t.plantId && t.plantName);
  return named?.plantName ?? "your plant";
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function groupCopy(
  key: TaskGroupKey,
  tasks: PlantTask[],
  maxPlants: number
): { title: string; subtitle: string } {
  const n = plantCountIn(tasks, maxPlants);
  const name = firstPlantName(tasks);
  // n === 0 means every task in the group is garden-level (weather/seasonal).
  const gardenOnly = n === 0;
  const single = tasks.length === 1;

  switch (key) {
    case "recovery":
      return {
        title: "Recovery Plan",
        subtitle: `${plural(tasks.length, "check-in")} for ${plural(Math.max(n, 1), "recovering plant")}.`,
      };
    case "water":
      if (gardenOnly) {
        return {
          title: "Garden Watering",
          subtitle: single ? tasks[0].title : `${tasks.length} weather watering tasks today.`,
        };
      }
      return n === 1
        ? { title: `Water ${name}`, subtitle: "Watering due today." }
        : { title: `Water ${n} Plants`, subtitle: `${n} plants need water.` };
    case "health":
      if (gardenOnly) {
        return {
          title: "Garden Check",
          subtitle: single ? tasks[0].title : `${tasks.length} quick garden checks today.`,
        };
      }
      return n === 1
        ? { title: `Check ${name}`, subtitle: `${name} could use a quick look.` }
        : { title: `Check ${n} Plants`, subtitle: `${n} plants could use a quick look.` };
    case "fertilize":
      if (gardenOnly) {
        return {
          title: "Garden Feeding",
          subtitle: single ? tasks[0].title : `${tasks.length} feeding tasks today.`,
        };
      }
      return n === 1
        ? { title: `Feed ${name}`, subtitle: "Feeding due." }
        : { title: `Fertilize ${n} Plants`, subtitle: `${n} plants due for feeding.` };
    case "prune":
      if (gardenOnly) {
        return {
          title: "Garden Pruning",
          subtitle: single ? tasks[0].title : `${tasks.length} pruning tasks today.`,
        };
      }
      return n === 1
        ? { title: `Prune ${name}`, subtitle: `${name} is ready for a trim.` }
        : { title: `Prune ${n} Plants`, subtitle: `${n} plants ready for a trim.` };
    case "repot":
      return n <= 1
        ? { title: `Repot ${gardenOnly ? "Time" : name}`, subtitle: "Ready for a bigger home." }
        : { title: `Repot ${n} Plants`, subtitle: `${n} plants ready for a bigger home.` };
    case "photo":
      return n <= 1
        ? { title: "Photo Time", subtitle: `${gardenOnly ? "Your garden" : name} could use a photo.` }
        : { title: "Photos", subtitle: `${n} plants could use a photo.` };
    case "harvest":
      return n <= 1
        ? { title: `Harvest ${gardenOnly ? "Time" : name}`, subtitle: "Ready to harvest." }
        : { title: "Harvest", subtitle: `${n} plants ready to harvest.` };
    default:
      return {
        title: single ? tasks[0].title : "Garden To-Dos",
        subtitle: single
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
    const key: TaskGroupKey = isRecoveryTask(task)
      ? "recovery"
      : (GROUP_OF_TYPE[task.taskType] ?? "other");
    const list = buckets.get(key) ?? [];
    list.push(task);
    buckets.set(key, list);
  }

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
      ...groupCopy(key, tasks, plantCount),
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

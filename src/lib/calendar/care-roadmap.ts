import type { Plant } from "@/lib/types";
import { defaultCareForSpecies } from "@/lib/plants/care-defaults";
import { parseDateKey } from "@/lib/tasks/task-engine";

export type CareRoadmapEventType =
  | "water"
  | "fertilizer"
  | "prune"
  | "weekly_check"
  | "pest_check"
  | "repot"
  | "weather"
  | "photo";

export type CareRoadmapSource = "care_plan" | "seasonal" | "weather" | "projection";

export interface CareRoadmapEvent {
  id: string;
  plantId: string;
  plantName: string;
  date: string;
  type: CareRoadmapEventType;
  icon: string;
  title: string;
  description: string;
  reason: string;
  priority: "low" | "medium" | "high";
  source: CareRoadmapSource;
}

export interface BuildCareRoadmapInput {
  plants: Plant[];
  city?: string;
  zone?: string;
  startDate?: Date;
  months?: number;
}

const EVENT_ICONS: Record<CareRoadmapEventType, string> = {
  water: "💧",
  fertilizer: "🍽️",
  prune: "✂️",
  weekly_check: "🔍",
  pest_check: "🐛",
  repot: "🪴",
  weather: "🌡️",
  photo: "📸",
};

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function seasonMultiplier(month: number, waterDays: number): number {
  // Northern hemisphere: summer Jun-Aug needs more frequent water
  if (month >= 5 && month <= 8) return Math.max(2, Math.round(waterDays * 0.85));
  if (month >= 11 || month <= 1) return Math.round(waterDays * 1.15);
  return waterDays;
}

function isGrowingSeason(month: number): boolean {
  return month >= 3 && month <= 9;
}

function pruneWindowMonths(species: string): number[] {
  const lower = species.toLowerCase();
  if (/citrus|lemon|lime|avocado/.test(lower)) return [1, 2, 11];
  if (/maple|oak|tree/.test(lower)) return [0, 1, 11];
  if (/rose|flower|bougainvillea/.test(lower)) return [2, 3, 10];
  return [2, 3, 8];
}

function projectWatering(plant: Plant, start: Date, end: Date): CareRoadmapEvent[] {
  const care = defaultCareForSpecies(plant.species);
  const events: CareRoadmapEvent[] = [];
  let cursor = plant.lastWateredAt
    ? startOfDay(new Date(plant.lastWateredAt))
    : startOfDay(start);

  while (cursor <= end) {
    const freq = seasonMultiplier(cursor.getMonth(), plant.waterFrequencyDays || care.waterFrequencyDays);
    cursor = addDays(cursor, freq);
    if (cursor > end) break;
    const key = dateKey(cursor);
    events.push({
      id: `roadmap-water-${plant.id}-${key}`,
      plantId: plant.id,
      plantName: plant.name,
      date: key,
      type: "water",
      icon: EVENT_ICONS.water,
      title: `Water ${plant.name}`,
      description: care.wateringInstructions,
      reason: `Every ~${freq} days based on species and season.`,
      priority: "medium",
      source: "projection",
    });
  }
  return events;
}

function projectFertilizer(plant: Plant, start: Date, end: Date): CareRoadmapEvent[] {
  const care = defaultCareForSpecies(plant.species);
  const weeks = plant.fertilizeFrequencyWeeks || care.fertilizeFrequencyWeeks;
  const events: CareRoadmapEvent[] = [];
  let cursor = plant.lastFertilizedAt
    ? startOfDay(new Date(plant.lastFertilizedAt))
    : addDays(start, 7);

  while (cursor <= end) {
    if (isGrowingSeason(cursor.getMonth())) {
      const key = dateKey(cursor);
      events.push({
        id: `roadmap-fert-${plant.id}-${key}`,
        plantId: plant.id,
        plantName: plant.name,
        date: key,
        type: "fertilizer",
        icon: EVENT_ICONS.fertilizer,
        title: `Feed ${plant.name}`,
        description: care.fertilizingInstructions,
        reason: "Growing season feed keeps leaves and fruit happy.",
        priority: "low",
        source: "seasonal",
      });
    }
    cursor = addDays(cursor, weeks * 7);
  }
  return events;
}

function projectWeeklyChecks(plant: Plant, start: Date, end: Date): CareRoadmapEvent[] {
  const events: CareRoadmapEvent[] = [];
  let cursor = startOfDay(start);
  while (cursor <= end) {
    const key = dateKey(cursor);
    events.push({
      id: `roadmap-weekly-${plant.id}-${key}`,
      plantId: plant.id,
      plantName: plant.name,
      date: key,
      type: "weekly_check",
      icon: EVENT_ICONS.weekly_check,
      title: `Weekly check: ${plant.name}`,
      description: "Look for pests, yellow leaves, and dry soil.",
      reason: "Routine inspection catches problems early.",
      priority: "low",
      source: "care_plan",
    });
    cursor = addDays(cursor, 7);
  }
  return events;
}

function projectPestChecks(plant: Plant, start: Date, end: Date): CareRoadmapEvent[] {
  const events: CareRoadmapEvent[] = [];
  let cursor = startOfDay(start);
  while (cursor <= end) {
    if (cursor.getMonth() >= 3 && cursor.getMonth() <= 9) {
      const key = dateKey(cursor);
      events.push({
        id: `roadmap-pest-${plant.id}-${key}`,
        plantId: plant.id,
        plantName: plant.name,
        date: key,
        type: "pest_check",
        icon: EVENT_ICONS.pest_check,
        title: `Pest check: ${plant.name}`,
        description: "Inspect undersides of leaves for mites and scale.",
        reason: "Warm months bring spider mites and aphids.",
        priority: "low",
        source: "seasonal",
      });
    }
    cursor = addDays(cursor, 14);
  }
  return events;
}

function projectPruneWindows(plant: Plant, start: Date, end: Date): CareRoadmapEvent[] {
  const months = pruneWindowMonths(plant.species);
  const events: CareRoadmapEvent[] = [];
  const care = defaultCareForSpecies(plant.species);
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= end) {
    if (months.includes(cursor.getMonth())) {
      const key = dateKey(cursor);
      events.push({
        id: `roadmap-prune-${plant.id}-${key}`,
        plantId: plant.id,
        plantName: plant.name,
        date: key,
        type: "prune",
        icon: EVENT_ICONS.prune,
        title: `Pruning window: ${plant.name}`,
        description: care.pruningInstructions,
        reason: plant.pruneSchedule || care.pruneSchedule,
        priority: "medium",
        source: "seasonal",
      });
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return events;
}

function projectPhotos(plant: Plant, start: Date, end: Date): CareRoadmapEvent[] {
  const events: CareRoadmapEvent[] = [];
  let cursor = plant.lastGrowthPhotoAt
    ? startOfDay(new Date(plant.lastGrowthPhotoAt))
    : addDays(start, 10);

  while (cursor <= end) {
    const key = dateKey(cursor);
    events.push({
      id: `roadmap-photo-${plant.id}-${key}`,
      plantId: plant.id,
      plantName: plant.name,
      date: key,
      type: "photo",
      icon: EVENT_ICONS.photo,
      title: `Progress photo: ${plant.name}`,
      description: "Snap a pic to track growth over time.",
      reason: "Photos make it easy to spot slow changes.",
      priority: "low",
      source: "care_plan",
    });
    cursor = addDays(cursor, 21);
  }
  return events;
}

function projectRepot(plant: Plant, start: Date, end: Date): CareRoadmapEvent[] {
  if (plant.lastRepottedAt) {
    const last = startOfDay(new Date(plant.lastRepottedAt));
    const next = addDays(last, 365 * 2);
    if (next >= start && next <= end) {
      return [
        {
          id: `roadmap-repot-${plant.id}-${dateKey(next)}`,
          plantId: plant.id,
          plantName: plant.name,
          date: dateKey(next),
          type: "repot",
          icon: EVENT_ICONS.repot,
          title: `Repot window: ${plant.name}`,
          description: "Fresh soil and a slightly larger pot if roots are crowded.",
          reason: "Most houseplants benefit from repotting every 1 to 2 years.",
          priority: "low",
          source: "care_plan",
        },
      ];
    }
  }
  const spring = new Date(start.getFullYear(), 2, 15);
  if (spring >= start && spring <= end) {
    return [
      {
        id: `roadmap-repot-${plant.id}-${dateKey(spring)}`,
        plantId: plant.id,
        plantName: plant.name,
        date: dateKey(spring),
        type: "repot",
        icon: EVENT_ICONS.repot,
        title: `Repot window: ${plant.name}`,
        description: "Spring is a gentle time to refresh soil.",
        reason: "Early spring repotting reduces transplant stress.",
        priority: "low",
        source: "seasonal",
      },
    ];
  }
  return [];
}

export function buildCareRoadmap(input: BuildCareRoadmapInput): CareRoadmapEvent[] {
  const start = startOfDay(input.startDate ?? new Date());
  const end = addDays(start, (input.months ?? 12) * 30);
  const all: CareRoadmapEvent[] = [];

  for (const plant of input.plants) {
    all.push(
      ...projectWatering(plant, start, end),
      ...projectFertilizer(plant, start, end),
      ...projectWeeklyChecks(plant, start, end),
      ...projectPestChecks(plant, start, end),
      ...projectPruneWindows(plant, start, end),
      ...projectPhotos(plant, start, end),
      ...projectRepot(plant, start, end)
    );
  }

  return all.sort((a, b) => a.date.localeCompare(b.date) || a.plantName.localeCompare(b.plantName));
}

export function roadmapEventsForDay(events: CareRoadmapEvent[], day: Date): CareRoadmapEvent[] {
  const key = dateKey(day);
  return events.filter((e) => e.date === key);
}

export function mergeRoadmapWithTasks<T extends { id: string; dueDate: string; plantId: string | null; plantName: string; title: string; description: string; taskType: string }>(
  roadmap: CareRoadmapEvent[],
  tasks: T[]
): CareRoadmapEvent[] {
  const taskKeys = new Set(tasks.map((t) => `${t.dueDate.slice(0, 10)}|${t.plantId}|${t.taskType}`));
  const merged = [...roadmap];
  for (const t of tasks) {
    const key = `${t.dueDate.slice(0, 10)}|${t.plantId}|${t.taskType}`;
    if (taskKeys.has(key)) continue;
    const typeMap: Record<string, CareRoadmapEventType> = {
      water: "water",
      fertilize: "fertilizer",
      prune: "prune",
      weekly_check: "weekly_check",
      inspect: "pest_check",
      repot: "repot",
      take_growth_photo: "photo",
    };
    const type = typeMap[t.taskType] ?? "weekly_check";
    merged.push({
      id: `task-${t.id}`,
      plantId: t.plantId ?? "",
      plantName: t.plantName,
      date: t.dueDate.slice(0, 10),
      type,
      icon: EVENT_ICONS[type] ?? "📋",
      title: t.title,
      description: t.description,
      reason: "Scheduled from your active care plan.",
      priority: "medium",
      source: "care_plan",
    });
  }
  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

export { parseDateKey, dateKey as roadmapDateKey };

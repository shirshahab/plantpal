import type { Plant } from "@/lib/types";
import { ACADEMY_PATHS, getPathProgress } from "./paths";
import { getAcademyLessonById } from "./lessons";

const SEASON_TOPICS: Record<string, string[]> = {
  spring: ["new-growth", "when-to-fertilize", "transplant-shock", "tomato-growing"],
  summer: ["water-hot-dry-summers", "heat-wave-stress", "overwatering-signs", "aphids"],
  fall: ["frost-protection", "seasonal-leaf-drop", "compost-basics", "mulch-basics"],
  winter: ["indoor-humidity", "frost-protection", "usda-zones", "yellow-leaves"],
};

function currentSeason(): keyof typeof SEASON_TOPICS {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

function plantsSuggestLessonIds(plants: Plant[]): string[] {
  const ids: string[] = [];
  for (const p of plants) {
    const blob = `${p.name} ${p.species} ${p.plantingType}`.toLowerCase();
    if (/citrus|lemon|orange|lime/.test(blob)) ids.push("citrus-trees", "citrus-watering", "fertilize-citrus");
    if (/tomato|pepper|veg|herb|basil/.test(blob)) ids.push("tomato-growing", "herb-garden", "companion-planting");
    if (/bonsai|maple|japanese/.test(blob)) ids.push("bonsai-wiring", "prune-safely", "maple-watering");
    if (/indoor|ficus|pothos|monstera/.test(blob)) ids.push("indoor-humidity", "overwatering-signs");
    if (/tree|avocado|apple|peach|fig|olive/.test(blob)) ids.push("fruit-trees", "water-deeply");
  }
  return ids;
}

function weakestPathLesson(completed: string[]): string | null {
  let worst: { id: string; percent: number } | null = null;
  for (const path of ACADEMY_PATHS) {
    const { percent, total, completed: done } = getPathProgress(path.id, completed);
    if (done >= total) continue;
    const next = path.lessonIds.find((id) => !completed.includes(id));
    if (!next) continue;
    if (!worst || percent < worst.percent) worst = { id: next, percent };
  }
  return worst?.id ?? null;
}

const HEALTH_LESSON_IDS = ["yellow-leaves", "overwatering-signs", "aphids"];

function pickFromList(list: string[], dayKey: string, salt: number): string {
  let hash = 0;
  const seed = `${dayKey}-${salt}`;
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
  return list[hash % list.length]!;
}

/** Deterministic daily pick — same lesson all day for a user. */
export function pickDailyLesson(
  completedLessons: string[],
  plants: Plant[],
  dayKey = new Date().toISOString().slice(0, 10),
  options?: { hasHealthSignals?: boolean }
): string | null {
  const available = (id: string) =>
    !completedLessons.includes(id) && !!getAcademyLessonById(id);

  // No plants yet → start with the beginner path, in order
  if (plants.length === 0) {
    const beginner = ACADEMY_PATHS.find((p) => p.id === "beginner-gardening");
    const next = beginner?.lessonIds.find(available);
    if (next) return next;
  }

  // Recent scans / health issues → plant health lessons first
  if (options?.hasHealthSignals) {
    const healthPath = ACADEMY_PATHS.find((p) => p.id === "plant-health");
    const healthCandidates = [
      ...HEALTH_LESSON_IDS.filter(available),
      ...(healthPath?.lessonIds.filter(available) ?? []),
    ];
    if (healthCandidates.length > 0) {
      return pickFromList([...new Set(healthCandidates)], dayKey, completedLessons.length);
    }
  }

  // Plant-specific lessons (citrus, bonsai, indoor, fruit…) take priority
  const plantSpecific = [...new Set(plantsSuggestLessonIds(plants).filter(available))];
  if (plantSpecific.length > 0) {
    return pickFromList(plantSpecific, dayKey, completedLessons.length);
  }

  // Then seasonal topics + weakest path + everything else
  const candidates = new Set<string>();
  for (const id of SEASON_TOPICS[currentSeason()] ?? []) {
    if (available(id)) candidates.add(id);
  }

  const weak = weakestPathLesson(completedLessons);
  if (weak) candidates.add(weak);

  for (const path of ACADEMY_PATHS) {
    for (const id of path.lessonIds) {
      if (available(id)) candidates.add(id);
    }
  }

  const list = [...candidates];
  if (list.length === 0) return null;
  return pickFromList(list, dayKey, completedLessons.length);
}

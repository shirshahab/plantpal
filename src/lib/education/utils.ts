import type { Plant } from "@/lib/types";
import type { CareLevel, EducationProgress } from "./types";
import { CARE_LEVEL_THRESHOLDS } from "./types";
import { LESSONS, getLessonById } from "./lessons";

export function getCareLevel(completedCount: number): CareLevel {
  for (const { level, minLessons } of CARE_LEVEL_THRESHOLDS) {
    if (completedCount >= minLessons) return level;
  }
  return "Seedling";
}

export function getNextLevelInfo(completedCount: number): {
  current: CareLevel;
  next: CareLevel | null;
  lessonsUntilNext: number;
  progressPercent: number;
} {
  const current = getCareLevel(completedCount);
  const currentIdx = CARE_LEVEL_THRESHOLDS.findIndex(
    (t) => t.level === current
  );
  const nextThreshold = CARE_LEVEL_THRESHOLDS[currentIdx - 1];

  if (!nextThreshold) {
    return {
      current,
      next: null,
      lessonsUntilNext: 0,
      progressPercent: 100,
    };
  }

  const currentMin =
    CARE_LEVEL_THRESHOLDS[currentIdx]?.minLessons ?? 0;
  const range = nextThreshold.minLessons - currentMin;
  const progress = completedCount - currentMin;

  return {
    current,
    next: nextThreshold.level,
    lessonsUntilNext: nextThreshold.minLessons - completedCount,
    progressPercent: Math.min(100, Math.round((progress / range) * 100)),
  };
}

export function getLessonsForPlant(plant: Plant, limit = 5) {
  const searchTerms = [
    plant.name.toLowerCase(),
    plant.species.toLowerCase(),
    plant.locationType,
    plant.plantingType,
  ];

  const scored = LESSONS.map((lesson) => {
    let score = 0;
    for (const term of searchTerms) {
      for (const related of lesson.relatedPlantTypes) {
        if (term.includes(related) || related.includes(term)) {
          score += 2;
        }
      }
    }
    if (plant.locationType === "indoor" && lesson.category === "Indoor Plants")
      score += 3;
    if (plant.locationType === "outdoor" && lesson.category === "Outdoor Gardens")
      score += 2;
    if (plant.locationType === "outdoor" && lesson.category === "Trees") score += 1;
    return { lesson, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.lesson);
}

export function isLessonComplete(
  lessonId: string,
  progress: EducationProgress
): boolean {
  return progress.completedLessons.includes(lessonId);
}

export function getLessonCompletionStatus(
  lessonId: string,
  progress: EducationProgress
): "completed" | "in_progress" | "not_started" {
  if (progress.completedLessons.includes(lessonId)) return "completed";
  if (progress.passedQuizzes.includes(lessonId)) return "in_progress";
  return "not_started";
}

export { getLessonById };

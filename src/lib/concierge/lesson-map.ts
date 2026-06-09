import { LESSONS } from "@/lib/education/lessons";
import type { ConciergeLessonLink } from "./types";

const ISSUE_LESSON_MAP: Array<{ keywords: string[]; lessonIds: string[] }> = [
  { keywords: ["yellow", "leaf", "leaves"], lessonIds: ["yellow-leaves", "water-deeply"] },
  { keywords: ["water", "dry", "wilting", "droopy"], lessonIds: ["water-deeply", "yellow-leaves"] },
  { keywords: ["pest", "bug", "aphid", "mite", "scale"], lessonIds: ["indoor-humidity", "yellow-leaves"] },
  { keywords: ["fertil", "nutrient", "deficiency"], lessonIds: ["fertilize-citrus", "yellow-leaves"] },
  { keywords: ["root", "rot", "mushy"], lessonIds: ["overwatering-signs", "water-deeply"] },
  { keywords: ["prune", "trim", "dead"], lessonIds: ["prune-safely"] },
];

export function suggestLessons(issue: string, species: string): ConciergeLessonLink[] {
  const lower = `${issue} ${species}`.toLowerCase();
  const ids = new Set<string>();

  for (const row of ISSUE_LESSON_MAP) {
    if (row.keywords.some((k) => lower.includes(k))) {
      row.lessonIds.forEach((id) => ids.add(id));
    }
  }

  if (ids.size === 0) {
    ids.add("yellow-leaves");
    ids.add("water-deeply");
  }

  return [...ids]
    .slice(0, 3)
    .map((lessonId) => {
      const lesson = LESSONS.find((l) => l.id === lessonId);
      return {
        lessonId,
        title: lesson?.title ?? lessonId,
        reason: lesson
          ? `Recommended for ${lesson.category.toLowerCase()} context`
          : "General care guidance",
      };
    });
}

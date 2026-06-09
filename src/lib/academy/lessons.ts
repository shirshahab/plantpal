import { LESSONS, getLessonById as getLegacyLesson } from "@/lib/education/lessons";
import type { Lesson } from "@/lib/education/types";
import { GENERATED_ACADEMY_LESSONS, getGeneratedLesson } from "./generated-lessons";
import { getPathForLesson } from "./paths";
import type { AcademyLesson } from "./types";

function enrichLegacyLesson(lesson: Lesson): AcademyLesson {
  const path = getPathForLesson(lesson.id);
  const paragraphs = lesson.content.split("\n\n");
  return {
    ...lesson,
    pathId: path?.id ?? "beginner-gardening",
    introduction:
      lesson.description ||
      `In this lesson you'll learn the essentials of ${lesson.title.toLowerCase()}.`,
    funFacts: [
      `Most gardeners revisit ${lesson.title.toLowerCase()} every season.`,
      "PlantPal Academy lessons take just a few minutes — small steps add up!",
    ],
    summary: lesson.keyTakeaways.slice(0, 2).join(" "),
  };
}

const legacyAcademyLessons: AcademyLesson[] = LESSONS.map(enrichLegacyLesson);

/** All academy lessons — generated + legacy, deduped by id. */
export const ALL_ACADEMY_LESSONS: AcademyLesson[] = [
  ...GENERATED_ACADEMY_LESSONS,
  ...legacyAcademyLessons.filter(
    (l) => !GENERATED_ACADEMY_LESSONS.some((g) => g.id === l.id)
  ),
];

export function getAcademyLessonById(id: string): AcademyLesson | undefined {
  const generated = getGeneratedLesson(id);
  if (generated) return generated;
  const legacy = getLegacyLesson(id);
  if (legacy) return enrichLegacyLesson(legacy);
  return ALL_ACADEMY_LESSONS.find((l) => l.id === id || l.slug === id);
}

export function getAcademyLessonCount(): number {
  return ALL_ACADEMY_LESSONS.length;
}

export { getPathForLesson, getPathById, ACADEMY_PATHS } from "./paths";

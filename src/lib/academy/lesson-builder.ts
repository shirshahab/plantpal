import type { AcademyLesson, LessonQuizInput } from "./types";
import type { LessonCategory, LessonDifficulty } from "@/lib/education/types";

interface LessonSpec {
  id: string;
  pathId: string;
  title: string;
  icon: string;
  description: string;
  introduction: string;
  content: string;
  funFacts: string[];
  keyTakeaways: string[];
  commonMistakes: string[];
  actionStep: string;
  summary: string;
  quiz: LessonQuizInput;
  category?: LessonCategory;
  difficulty?: LessonDifficulty;
  estimatedMinutes?: number;
}

export function buildAcademyLesson(spec: LessonSpec): AcademyLesson {
  const slug = spec.id.replace(/_/g, "-");
  return {
    id: spec.id,
    slug,
    pathId: spec.pathId,
    title: spec.title,
    category: spec.category ?? "Plant Basics",
    difficulty: spec.difficulty ?? "Beginner",
    estimatedMinutes: spec.estimatedMinutes ?? 3,
    description: spec.description,
    icon: spec.icon,
    introduction: spec.introduction,
    content: spec.content,
    funFacts: spec.funFacts,
    summary: spec.summary,
    keyTakeaways: spec.keyTakeaways,
    commonMistakes: spec.commonMistakes,
    actionStep: spec.actionStep,
    quiz: spec.quiz,
    relatedPlantTypes: [],
  };
}

/** Quick lesson builder for micro-learning content. */
export function quickLesson(
  id: string,
  pathId: string,
  title: string,
  icon: string,
  body: string,
  quizQ: string,
  quizCorrect: string,
  quizWrong: string[] = ["Ignore it", "Remove the plant", "Add bleach"],
  extras?: {
    plantyMoment?: string;
    whyItMatters?: string;
    realWorldExample?: string;
    actionStep?: string;
  }
): AcademyLesson {
  const plantyMoment =
    extras?.plantyMoment ??
    "Plants are dramatic. Yellow leaves are their way of waving a tiny flag.";
  const whyItMatters =
    extras?.whyItMatters ??
    `Getting ${title.toLowerCase()} right saves you from the guess-and-hope cycle.`;
  const realWorldExample =
    extras?.realWorldExample ??
    `Picture a patio plant wilting at 2pm but perky by morning. That's a clue about ${title.toLowerCase()}, not a death sentence.`;

  return buildAcademyLesson({
    id,
    pathId,
    title,
    icon,
    description: body.slice(0, 120) + (body.length > 120 ? "…" : ""),
    introduction: `${plantyMoment} Today we're tackling ${title.toLowerCase()}: ${whyItMatters.toLowerCase()}`,
    content: `${body}\n\nWhy it matters: ${whyItMatters}\n\nReal-world example: ${realWorldExample}`,
    funFacts: [
      plantyMoment,
      `Pro move: observe one plant for a week after changing ${title.toLowerCase()} habits.`,
    ],
    keyTakeaways: [
      body.split(".")[0]?.trim() + "." || whyItMatters,
      "Change one thing, watch for a week, then adjust.",
    ],
    commonMistakes: [
      "Acting before checking soil, light, and pot size",
      "Copying a tip that doesn't match your climate or season",
    ],
    actionStep:
      extras?.actionStep ??
      `Pick one plant and test one ${title.toLowerCase()} adjustment today, then note what changes in 48 hours.`,
    summary: `You can now spot ${title.toLowerCase()} issues early and fix them with confidence.`,
    quiz: {
      question: quizQ,
      options: [quizWrong[0], quizCorrect, quizWrong[1] ?? quizWrong[0], quizWrong[2] ?? "Water daily no matter what"],
      correctIndex: 1,
      explanation: `${quizCorrect}. That's the move that keeps plants happy long-term.`,
    },
  });
}

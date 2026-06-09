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
  quizWrong: string[] = ["Ignore it", "Remove the plant", "Add bleach"]
): AcademyLesson {
  return buildAcademyLesson({
    id,
    pathId,
    title,
    icon,
    description: body.slice(0, 120) + (body.length > 120 ? "…" : ""),
    introduction: `Let's learn about ${title.toLowerCase()} — a skill every great gardener builds.`,
    content: body,
    funFacts: [
      `Master gardeners revisit ${title.toLowerCase()} every season.`,
      "Small improvements compound into a thriving garden over time.",
    ],
    keyTakeaways: [body.split(".")[0] + ".", "Apply one change today and observe your plant for a week."],
    commonMistakes: ["Rushing without observing the plant first", "Copying advice without checking your climate"],
    actionStep: `Pick one plant and apply what you learned about ${title.toLowerCase()} today.`,
    summary: `You now understand the basics of ${title.toLowerCase()}. Keep practicing!`,
    quiz: {
      question: quizQ,
      options: [quizWrong[0], quizCorrect, quizWrong[1] ?? quizWrong[0], quizWrong[2] ?? "Water daily no matter what"],
      correctIndex: 1,
      explanation: `${quizCorrect} is the best approach for healthy plants.`,
    },
  });
}

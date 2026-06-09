import type { AcademyLesson } from "./types";
import { quizTypeForLesson, normalizeQuiz, type AcademyQuiz } from "./quiz-types";

const PLANTY_LINES = [
  "Plants are dramatic. This is their way of waving a tiny flag.",
  "Planty says: slow down, observe first, panic later — preferably never.",
  "Fun fact: I don't have roots, but I still forget to drink water sometimes. You can do better!",
  "Every master gardener killed a plant on the way. The difference? They learned the lesson.",
  "Your plant can't text you. Yellow leaves are basically a group chat message.",
  "Think of this like plant first aid — check vitals before prescribing fertilizer.",
];

const WHY_TEMPLATES = [
  "This skill saves plants (and saves you from guessing).",
  "Getting this wrong is the #1 reason beginner gardens struggle.",
  "You'll use this every season — not just once.",
  "This is the difference between thriving plants and mystery casualties.",
];

const EXAMPLE_TEMPLATES = [
  "Your neighbor's lemon tree droops every afternoon but perks up by morning — that's a watering rhythm clue, not a crisis.",
  "A patio tomato in a black pot wilts by 2pm in July even though you watered at 8am — heat + small soil volume.",
  "New growth on a fiddle leaf fig is pale green while old leaves stay dark — often a light or nitrogen signal.",
  "Mint in a bed invades everything within one season — great lesson in container boundaries.",
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * 17) % 9973;
  return h;
}

function isGenericIntro(intro: string): boolean {
  return intro.startsWith("Let's learn about") || intro.length < 40;
}

function isGenericContent(content: string): boolean {
  return content.length < 120 || !content.includes("\n");
}

/** Add personality + structure to any lesson (generated or legacy). */
export function enrichLessonPersonality(lesson: AcademyLesson): AcademyLesson {
  const h = hashId(lesson.id);
  const plantyMoment = lesson.plantyMoment ?? PLANTY_LINES[h % PLANTY_LINES.length]!;
  const whyItMatters = lesson.whyItMatters ?? WHY_TEMPLATES[h % WHY_TEMPLATES.length]!;
  const realWorldExample =
    lesson.realWorldExample ?? EXAMPLE_TEMPLATES[h % EXAMPLE_TEMPLATES.length]!;

  let introduction = lesson.introduction;
  if (isGenericIntro(introduction)) {
    introduction = `${plantyMoment} Today: ${lesson.title.toLowerCase()} — ${whyItMatters.toLowerCase()}`;
  }

  let content = lesson.content;
  if (isGenericContent(content)) {
    content = `${content}\n\nReal talk: ${realWorldExample}\n\nTry this today: ${lesson.actionStep}`;
  }

  const quizType = lesson.quizType ?? quizTypeForLesson(lesson.id);
  const academyQuiz: AcademyQuiz = lesson.academyQuiz
    ? lesson.academyQuiz
    : normalizeQuiz(lesson.quiz, quizType);

  return {
    ...lesson,
    introduction,
    content,
    whyItMatters,
    realWorldExample,
    plantyMoment,
    quizType,
    academyQuiz,
    funFacts: lesson.funFacts.some((f) => f.includes("Master gardeners revisit"))
      ? [
          plantyMoment,
          `Pro move: ${lesson.actionStep}`,
        ]
      : lesson.funFacts,
    commonMistakes:
      lesson.commonMistakes.length > 0 &&
      !lesson.commonMistakes[0]?.includes("Rushing without observing")
        ? lesson.commonMistakes
        : [
            "Skipping the 30-second soil check before acting",
            "Copying a tip that doesn't match your climate or pot size",
            ...(lesson.commonMistakes.slice(0, 1)),
          ],
  };
}

/** Academy quiz shapes — extends legacy multiple choice. */

export type QuizType =
  | "multiple_choice"
  | "true_false"
  | "matching"
  | "scenario"
  | "image_identify";

export interface QuizBase {
  type: QuizType;
  question: string;
  explanation: string;
}

export interface MultipleChoiceQuiz extends QuizBase {
  type: "multiple_choice";
  options: string[];
  correctIndex: number;
}

export interface TrueFalseQuiz extends QuizBase {
  type: "true_false";
  correct: boolean;
}

export interface MatchingQuiz extends QuizBase {
  type: "matching";
  pairs: { left: string; right: string }[];
}

export interface ScenarioQuiz extends QuizBase {
  type: "scenario";
  context: string;
  options: string[];
  correctIndex: number;
}

export interface ImageIdentifyQuiz extends QuizBase {
  type: "image_identify";
  placeholderLabel: string;
  options: string[];
  correctIndex: number;
}

export type AcademyQuiz =
  | MultipleChoiceQuiz
  | TrueFalseQuiz
  | MatchingQuiz
  | ScenarioQuiz
  | ImageIdentifyQuiz;

/** Convert legacy LessonQuiz to AcademyQuiz */
export function normalizeQuiz(
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  },
  preferredType?: QuizType
): AcademyQuiz {
  const type = preferredType ?? "multiple_choice";
  if (type === "true_false" && quiz.options.length >= 2) {
    return {
      type: "true_false",
      question: quiz.question,
      correct: quiz.correctIndex === quiz.options.indexOf("True") || quiz.options[quiz.correctIndex] === "True",
      explanation: quiz.explanation,
    };
  }
  if (type === "scenario") {
    return {
      type: "scenario",
      question: quiz.question,
      context: "Picture this in your garden today…",
      options: quiz.options,
      correctIndex: quiz.correctIndex,
      explanation: quiz.explanation,
    };
  }
  if (type === "image_identify") {
    return {
      type: "image_identify",
      question: quiz.question,
      placeholderLabel: "Plant photo",
      options: quiz.options,
      correctIndex: quiz.correctIndex,
      explanation: quiz.explanation,
    };
  }
  if (type === "matching" && quiz.options.length >= 4) {
    const half = Math.floor(quiz.options.length / 2);
    return {
      type: "matching",
      question: quiz.question,
      pairs: quiz.options.slice(0, half).map((left, i) => ({
        left,
        right: quiz.options[half + i] ?? quiz.options[i + 1] ?? "?",
      })),
      explanation: quiz.explanation,
    };
  }
  return {
    type: "multiple_choice",
    question: quiz.question,
    options: quiz.options,
    correctIndex: quiz.correctIndex,
    explanation: quiz.explanation,
  };
}

/** Pick quiz type from lesson id for variety */
export function quizTypeForLesson(lessonId: string): QuizType {
  const types: QuizType[] = [
    "multiple_choice",
    "true_false",
    "scenario",
    "multiple_choice",
    "image_identify",
    "matching",
  ];
  let hash = 0;
  for (let i = 0; i < lessonId.length; i++) hash += lessonId.charCodeAt(i);
  return types[hash % types.length]!;
}

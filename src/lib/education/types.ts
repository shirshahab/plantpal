export type LessonCategory =
  | "Plant Basics"
  | "Watering"
  | "Soil"
  | "Fertilizer"
  | "Sunlight"
  | "Pruning"
  | "Pests & Disease"
  | "Trees"
  | "Indoor Plants"
  | "Outdoor Gardens"
  | "Climate";

export type LessonDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type CareLevel =
  | "Seedling"
  | "Sprout"
  | "Grower"
  | "Gardener"
  | "Plant Pro";

export interface LessonQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  category: LessonCategory;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  description: string;
  icon: string;
  content: string;
  keyTakeaways: string[];
  commonMistakes: string[];
  actionStep: string;
  quiz: LessonQuiz;
  relatedPlantTypes: string[];
}

export interface DailyTip {
  id: string;
  text: string;
  lessonId: string;
  whyItMatters?: string;
  actionToday?: string;
}

export interface EducationProgress {
  completedLessons: string[];
  passedQuizzes: string[];
}

export const LESSON_CATEGORIES: LessonCategory[] = [
  "Plant Basics",
  "Watering",
  "Soil",
  "Fertilizer",
  "Sunlight",
  "Pruning",
  "Pests & Disease",
  "Trees",
  "Indoor Plants",
  "Outdoor Gardens",
];

export const CARE_LEVEL_THRESHOLDS: {
  level: CareLevel;
  minLessons: number;
}[] = [
  { level: "Plant Pro", minLessons: 10 },
  { level: "Gardener", minLessons: 6 },
  { level: "Grower", minLessons: 3 },
  { level: "Sprout", minLessons: 1 },
  { level: "Seedling", minLessons: 0 },
];

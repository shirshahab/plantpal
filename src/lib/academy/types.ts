import type { Lesson, LessonQuiz } from "@/lib/education/types";

export type AcademyRank =
  | "Seedling"
  | "Sprout"
  | "Gardener"
  | "Green Thumb"
  | "Master Grower"
  | "Botanical Expert"
  | "Plant Wizard";

export type XpEventType =
  | "lesson_completed"
  | "quiz_passed"
  | "plant_added"
  | "plant_healthy_30d"
  | "growth_photo"
  | "diagnosis_completed"
  | "daily_login";

export type BadgeCategory =
  | "milestone"
  | "learning"
  | "care"
  | "collection"
  | "family";

export type QuizType = "multiple_choice" | "true_false" | "scenario";

export interface AcademyPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  lessonIds: string[];
  certificateId: string | null;
  kidSafe: boolean;
}

export interface AcademyLesson extends Lesson {
  pathId: string;
  introduction: string;
  funFacts: string[];
  summary: string;
  quizType?: QuizType;
}

export interface AcademyBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  /** XP or lesson count threshold, or special unlock key */
  unlockKey: string;
  target?: number;
}

export interface AcademyCertificate {
  id: string;
  title: string;
  description: string;
  pathId: string;
  icon: string;
}

export interface AcademyProgress {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  unlockedBadges: string[];
  earnedCertificates: string[];
  completedLessons: string[];
  passedQuizzes: string[];
  familyMode: boolean;
  xpLog: { type: XpEventType; amount: number; at: string }[];
}

export interface RankInfo {
  rank: AcademyRank;
  level: number;
  xpInRank: number;
  xpToNextRank: number;
  progressPercent: number;
}

export type LessonQuizInput = LessonQuiz;

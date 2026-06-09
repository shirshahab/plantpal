import type { Lesson, LessonQuiz } from "@/lib/education/types";
import type { AcademyQuiz, QuizType } from "./quiz-types";

export type { QuizType, AcademyQuiz };

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
  | "daily_login"
  | "task_completed"
  | "price_check_completed"
  | "daily_mission_completed"
  | "weekly_mission_completed"
  | "family_challenge_completed"
  | "seasonal_task_completed"
  | "garden_map_updated";

export type BadgeCategory =
  | "milestone"
  | "learning"
  | "care"
  | "collection"
  | "family";

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
  whyItMatters?: string;
  realWorldExample?: string;
  plantyMoment?: string;
  quizType?: QuizType;
  academyQuiz?: AcademyQuiz;
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
  streakFreezes: number;
  streakFreezeUsedDate: string | null;
  lastStreakMilestone: number;
  unlockedBadges: string[];
  badgeUnlockedAt: Record<string, string>;
  earnedCertificates: string[];
  completedLessons: string[];
  passedQuizzes: string[];
  familyMode: boolean;
  xpLog: { type: XpEventType; amount: number; at: string }[];
}

export interface LessonCompleteResult {
  lessonId: string;
  xpEarned: number;
  streak: number;
  streakMilestone?: 3 | 7 | 30;
  newBadges: string[];
  nextLessonId: string | null;
  pathId: string | null;
}

export interface RankInfo {
  rank: AcademyRank;
  level: number;
  xpInRank: number;
  xpToNextRank: number;
  progressPercent: number;
}

export type LessonQuizInput = LessonQuiz;

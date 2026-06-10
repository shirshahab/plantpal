"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AcademyProgress, LessonCompleteResult, XpEventType } from "@/lib/academy/types";
import { xpForEvent, xpProgressInLevel } from "@/lib/academy/xp";
import { getRankForXp, getRankInfo } from "@/lib/academy/ranks";
import { ACADEMY_BADGES } from "@/lib/academy/badges";
import { ACADEMY_CERTIFICATES } from "@/lib/academy/certificates";
import { trackEvent } from "@/lib/analytics/track";
import {
  ACADEMY_PATHS,
  getPathProgress,
  getContinueLessonId,
  getPathForLesson,
  getNextLessonInPath,
} from "@/lib/academy/paths";
import { usePlants } from "./plants-provider";
import { useEngagement } from "./engagement-provider";
import { subscribeAwardXp } from "@/lib/academy/xp-events";
import { getAcademyLessonById } from "@/lib/academy/lessons";
import { publishActivityEvent } from "@/lib/social/events";
import { useToast } from "./toast-provider";

const STORAGE_KEY = "plantpal-academy";

const STREAK_MILESTONES = [3, 7, 30] as const;

const defaultProgress: AcademyProgress = {
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  streakFreezes: 1,
  streakFreezeUsedDate: null,
  lastStreakMilestone: 0,
  unlockedBadges: [],
  badgeUnlockedAt: {},
  earnedCertificates: [],
  completedLessons: [],
  passedQuizzes: [],
  familyMode: false,
  xpLog: [],
};

interface AcademyContextValue {
  progress: AcademyProgress;
  loading: boolean;
  rankInfo: ReturnType<typeof getRankInfo>;
  levelProgress: ReturnType<typeof xpProgressInLevel>;
  lastCompletion: LessonCompleteResult | null;
  clearLastCompletion: () => void;
  awardXp: (type: XpEventType, meta?: { silent?: boolean }) => number;
  completeLesson: (lessonId: string) => LessonCompleteResult | null;
  isLessonComplete: (lessonId: string) => boolean;
  continueLessonId: string | null;
  toggleFamilyMode: () => void;
  badges: typeof ACADEMY_BADGES;
  syncBadgesAndCertificates: () => string[];
  recordDailyLogin: () => void;
  isStreakAtRisk: () => boolean;
  useStreakFreeze: () => void;
}

const AcademyContext = createContext<AcademyContextValue | null>(null);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function streakMilestone(streak: number, last: number): 3 | 7 | 30 | undefined {
  for (const m of STREAK_MILESTONES) {
    if (streak >= m && last < m) return m;
  }
  return undefined;
}

export function AcademyProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<AcademyProgress>(defaultProgress);
  const [loading, setLoading] = useState(true);
  const [lastCompletion, setLastCompletion] = useState<LessonCompleteResult | null>(null);
  const { plants } = usePlants();
  const { stats } = useEngagement();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress({ ...defaultProgress, ...JSON.parse(stored) });
      }
      const edu = localStorage.getItem("plantpal-education");
      if (edu) {
        const parsed = JSON.parse(edu) as {
          completedLessons?: string[];
          passedQuizzes?: string[];
        };
        setProgress((prev) => ({
          ...prev,
          completedLessons: [
            ...new Set([...prev.completedLessons, ...(parsed.completedLessons ?? [])]),
          ],
          passedQuizzes: [
            ...new Set([...prev.passedQuizzes, ...(parsed.passedQuizzes ?? [])]),
          ],
        }));
      }
    } catch {
      /* default */
    }
    setLoading(false);
  }, []);

  const persist = useCallback((next: AcademyProgress) => {
    setProgress(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem(
      "plantpal-education",
      JSON.stringify({
        completedLessons: next.completedLessons,
        passedQuizzes: next.passedQuizzes,
      })
    );
  }, []);

  const computeBadges = useCallback(
    (prev: AcademyProgress): { unlocked: string[]; badgeUnlockedAt: Record<string, string> } => {
      const unlocked = new Set(prev.unlockedBadges);
      const badgeUnlockedAt = { ...prev.badgeUnlockedAt };
      const now = new Date().toISOString();
      const rank = getRankForXp(prev.totalXp);
      const lessonCount = prev.completedLessons.length;

      const add = (id: string) => {
        if (!unlocked.has(id)) badgeUnlockedAt[id] = now;
        unlocked.add(id);
      };

      if (plants.length >= 1) add("first-plant");
      if (stats.scans >= 1) add("first-diagnosis");
      if (lessonCount >= 1) add("first-lesson");
      if (lessonCount >= 25) add("lessons-25");
      if (prev.currentStreak >= 7) add("streak-7");
      if (prev.currentStreak >= 30) add("streak-30");
      if (prev.currentStreak >= 100) add("streak-100");
      if (rank === "Botanical Expert" || rank === "Plant Wizard") add("botanical-expert");
      if (rank === "Plant Wizard") add("plant-wizard");

      const hasFruitTree = plants.some((p) =>
        /citrus|lemon|avocado|apple|peach|fig|olive|pomegranate|fruit|tree/i.test(
          `${p.name} ${p.species}`
        )
      );
      if (hasFruitTree) add("fruit-tree-owner");

      const certs = new Set(prev.earnedCertificates);
      for (const path of ACADEMY_PATHS) {
        const { percent } = getPathProgress(path.id, prev.completedLessons);
        if (percent === 100 && path.certificateId) certs.add(path.certificateId);
        if (percent === 100) {
          if (path.id === "soil-mastery") add("compost-hero");
          if (path.id === "garden-bugs") add("bug-hunter");
          if (path.id === "water-mastery") add("water-master");
          if (path.id === "plant-health") add("plant-doctor");
          if (path.id === "bonsai") add("bonsai-beginner");
        }
      }

      if (certs.size >= 5) add("master-gardener");
      if (certs.size === ACADEMY_PATHS.length) certs.add("cert-master-gardener");

      return { unlocked: [...unlocked], badgeUnlockedAt };
    },
    [plants, stats.scans]
  );

  const awardXp = useCallback(
    (type: XpEventType, meta?: { silent?: boolean }) => {
      const amount = xpForEvent(type);
      setProgress((prev) => {
        const next = {
          ...prev,
          totalXp: prev.totalXp + amount,
          xpLog: [
            { type, amount, at: new Date().toISOString() },
            ...prev.xpLog.slice(0, 49),
          ],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      if (!meta?.silent) {
        toast(`+${amount} XP`);
      }
      return amount;
    },
    [toast]
  );

  const syncBadgesAndCertificates = useCallback((): string[] => {
    let newBadges: string[] = [];
    setProgress((prev) => {
      const before = new Set(prev.unlockedBadges);
      const { unlocked, badgeUnlockedAt } = computeBadges(prev);
      newBadges = unlocked.filter((id) => !before.has(id));

      const certs = new Set(prev.earnedCertificates);
      for (const path of ACADEMY_PATHS) {
        const { percent } = getPathProgress(path.id, prev.completedLessons);
        if (percent === 100 && path.certificateId) certs.add(path.certificateId);
      }
      if (certs.size === ACADEMY_PATHS.length) certs.add("cert-master-gardener");

      const next = {
        ...prev,
        unlockedBadges: unlocked,
        badgeUnlockedAt,
        earnedCertificates: [...certs],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return newBadges;
  }, [computeBadges]);

  const computeStreakUpdate = useCallback(
    (prev: AcademyProgress): { streak: number; milestone?: 3 | 7 | 30; next: AcademyProgress } => {
      const today = todayKey();
      if (prev.lastActiveDate === today) {
        return { streak: prev.currentStreak, next: prev };
      }
      let streak = 1;
      if (prev.lastActiveDate === yesterdayKey()) {
        streak = prev.currentStreak + 1;
      }
      const milestone = streakMilestone(streak, prev.lastStreakMilestone);
      const next = {
        ...prev,
        currentStreak: streak,
        longestStreak: Math.max(prev.longestStreak, streak),
        lastActiveDate: today,
        lastStreakMilestone: milestone
          ? Math.max(prev.lastStreakMilestone, milestone)
          : prev.lastStreakMilestone,
      };
      return { streak, milestone, next };
    },
    []
  );

  const updateStreak = useCallback(() => {
    let result = { streak: 1, milestone: undefined as 3 | 7 | 30 | undefined };
    setProgress((prev) => {
      const { streak, milestone, next } = computeStreakUpdate(prev);
      result = { streak, milestone };
      if (next === prev) return prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return result;
  }, [computeStreakUpdate]);

  const recordDailyLogin = useCallback(() => {
    updateStreak();
    setProgress((prev) => {
      const today = todayKey();
      const already = prev.xpLog.some(
        (e) => e.type === "daily_login" && e.at.startsWith(today)
      );
      if (already) return prev;
      const amount = xpForEvent("daily_login");
      const next = {
        ...prev,
        totalXp: prev.totalXp + amount,
        xpLog: [
          { type: "daily_login" as XpEventType, amount, at: new Date().toISOString() },
          ...prev.xpLog.slice(0, 49),
        ],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [updateStreak]);

  const completeLesson = useCallback(
    (lessonId: string): LessonCompleteResult | null => {
      let completion: LessonCompleteResult | null = null;
      let isFirstLesson = false;

      setProgress((prev) => {
        if (prev.completedLessons.includes(lessonId)) return prev;
        isFirstLesson = prev.completedLessons.length === 0;

        const { streak, milestone, next: streaked } = computeStreakUpdate(prev);
        const lessonXp = xpForEvent("lesson_completed");
        const quizXp = xpForEvent("quiz_passed");
        const xpEarned = lessonXp + quizXp;

        const path = getPathForLesson(lessonId);
        const pathId = path?.id ?? null;
        const completedLessons = [...streaked.completedLessons, lessonId];

        const nextBase = {
          ...streaked,
          completedLessons,
          passedQuizzes: [...new Set([...streaked.passedQuizzes, lessonId])],
          totalXp: streaked.totalXp + xpEarned,
          xpLog: [
            { type: "quiz_passed" as XpEventType, amount: quizXp, at: new Date().toISOString() },
            { type: "lesson_completed" as XpEventType, amount: lessonXp, at: new Date().toISOString() },
            ...streaked.xpLog.slice(0, 48),
          ],
        };

        const { unlocked, badgeUnlockedAt } = computeBadges(nextBase);
        const before = new Set(prev.unlockedBadges);
        const newBadges = unlocked.filter((id) => !before.has(id));
        const next = { ...nextBase, unlockedBadges: unlocked, badgeUnlockedAt };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        localStorage.setItem(
          "plantpal-education",
          JSON.stringify({
            completedLessons: next.completedLessons,
            passedQuizzes: next.passedQuizzes,
          })
        );

        const nextInPath = pathId ? getNextLessonInPath(pathId, completedLessons) : null;
        const nextLessonId = nextInPath ?? getContinueLessonId(completedLessons);

        completion = {
          lessonId,
          xpEarned,
          streak,
          streakMilestone: milestone,
          newBadges,
          nextLessonId,
          pathId,
        };

        return next;
      });

      if (completion) {
        const result: LessonCompleteResult = completion;
        setLastCompletion(result);
        trackEvent("lesson_completed", { lessonId, isFirst: isFirstLesson });
        const lesson = getAcademyLessonById(lessonId);
        void publishActivityEvent({
          userId: "local-user",
          eventType: "lesson_completed",
          title: `completed ${lesson?.title ?? "an Academy lesson"}`,
          visibility: "friends",
        });
        for (const badgeId of result.newBadges) {
          const badge = ACADEMY_BADGES.find((b) => b.id === badgeId);
          void publishActivityEvent({
            userId: "local-user",
            eventType: "badge_earned",
            title: `earned ${badge?.title ?? "a badge"}`,
            visibility: "friends",
          });
        }
        if (result.streakMilestone) {
          void publishActivityEvent({
            userId: "local-user",
            eventType: "streak_milestone",
            title: `completed a ${result.streak}-day streak`,
            visibility: "friends",
          });
        }
      }
      return completion;
    },
    [computeStreakUpdate, computeBadges]
  );

  const clearLastCompletion = useCallback(() => setLastCompletion(null), []);

  const isStreakAtRisk = useCallback(() => {
    const today = todayKey();
    return (
      progress.currentStreak > 0 &&
      progress.lastActiveDate !== today &&
      progress.lastActiveDate === yesterdayKey()
    );
  }, [progress.currentStreak, progress.lastActiveDate]);

  const useStreakFreeze = useCallback(() => {
    setProgress((prev) => {
      if (prev.streakFreezes <= 0) return prev;
      const today = todayKey();
      if (prev.streakFreezeUsedDate === today) return prev;
      const next = {
        ...prev,
        streakFreezes: prev.streakFreezes - 1,
        streakFreezeUsedDate: today,
        lastActiveDate: yesterdayKey(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    toast("Streak freeze used — your streak is protected for today.");
  }, [toast]);

  useEffect(() => {
    return subscribeAwardXp((type) => {
      awardXp(type);
    });
  }, [awardXp]);

  useEffect(() => {
    if (loading) return;
    recordDailyLogin();
  }, [loading, recordDailyLogin]);

  useEffect(() => {
    if (loading) return;
    syncBadgesAndCertificates();
  }, [
    loading,
    plants.length,
    progress.completedLessons.length,
    progress.totalXp,
    progress.currentStreak,
    syncBadgesAndCertificates,
  ]);

  const isLessonComplete = useCallback(
    (lessonId: string) => progress.completedLessons.includes(lessonId),
    [progress.completedLessons]
  );

  const toggleFamilyMode = useCallback(() => {
    persist({ ...progress, familyMode: !progress.familyMode });
  }, [persist, progress]);

  const rankInfo = useMemo(() => getRankInfo(progress.totalXp), [progress.totalXp]);
  const levelProgress = useMemo(() => xpProgressInLevel(progress.totalXp), [progress.totalXp]);
  const continueLessonId = useMemo(
    () => getContinueLessonId(progress.completedLessons),
    [progress.completedLessons]
  );

  return (
    <AcademyContext.Provider
      value={{
        progress,
        loading,
        rankInfo,
        levelProgress,
        lastCompletion,
        clearLastCompletion,
        awardXp,
        completeLesson,
        isLessonComplete,
        continueLessonId,
        toggleFamilyMode,
        badges: ACADEMY_BADGES,
        syncBadgesAndCertificates,
        recordDailyLogin,
        isStreakAtRisk,
        useStreakFreeze,
      }}
    >
      {children}
    </AcademyContext.Provider>
  );
}

export function useAcademy() {
  const ctx = useContext(AcademyContext);
  if (!ctx) throw new Error("useAcademy must be used within AcademyProvider");
  return ctx;
}

export function useAcademyXp() {
  const ctx = useContext(AcademyContext);
  return ctx?.awardXp ?? (() => 0);
}

export { ACADEMY_CERTIFICATES };

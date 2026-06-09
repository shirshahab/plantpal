"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AcademyProgress, XpEventType } from "@/lib/academy/types";
import { xpForEvent, xpProgressInLevel } from "@/lib/academy/xp";
import { getRankForXp, getRankInfo } from "@/lib/academy/ranks";
import { ACADEMY_BADGES } from "@/lib/academy/badges";
import { ACADEMY_CERTIFICATES } from "@/lib/academy/certificates";
import {
  ACADEMY_PATHS,
  getPathProgress,
  getContinueLessonId,
} from "@/lib/academy/paths";
import { usePlants } from "./plants-provider";
import { useEngagement } from "./engagement-provider";
import { subscribeAwardXp } from "@/lib/academy/xp-events";
import { useToast } from "./toast-provider";

const STORAGE_KEY = "plantpal-academy";

const defaultProgress: AcademyProgress = {
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  unlockedBadges: [],
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
  awardXp: (type: XpEventType, meta?: { silent?: boolean }) => number;
  completeLesson: (lessonId: string) => void;
  isLessonComplete: (lessonId: string) => boolean;
  continueLessonId: string | null;
  toggleFamilyMode: () => void;
  badges: typeof ACADEMY_BADGES;
  syncBadgesAndCertificates: () => void;
  recordDailyLogin: () => void;
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

export function AcademyProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<AcademyProgress>(defaultProgress);
  const [loading, setLoading] = useState(true);
  const { plants } = usePlants();
  const { stats } = useEngagement();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProgress({ ...defaultProgress, ...JSON.parse(stored) });
      // Migrate legacy education progress
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
    // Keep legacy education key in sync
    localStorage.setItem(
      "plantpal-education",
      JSON.stringify({
        completedLessons: next.completedLessons,
        passedQuizzes: next.passedQuizzes,
      })
    );
  }, []);

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

  const syncBadgesAndCertificates = useCallback(() => {
    setProgress((prev) => {
      const unlocked = new Set(prev.unlockedBadges);
      const certs = new Set(prev.earnedCertificates);
      const rank = getRankForXp(prev.totalXp);
      const lessonCount = prev.completedLessons.length;

      if (plants.length >= 1) unlocked.add("first-plant");
      if (stats.scans >= 1) unlocked.add("first-diagnosis");
      if (lessonCount >= 1) unlocked.add("first-lesson");
      if (lessonCount >= 25) unlocked.add("lessons-25");
      if (prev.currentStreak >= 7) unlocked.add("streak-7");
      if (prev.currentStreak >= 30) unlocked.add("streak-30");
      if (prev.currentStreak >= 100) unlocked.add("streak-100");
      if (rank === "Botanical Expert" || rank === "Plant Wizard") unlocked.add("botanical-expert");
      if (rank === "Plant Wizard") unlocked.add("plant-wizard");

      const hasFruitTree = plants.some(
        (p) =>
          /citrus|lemon|avocado|apple|peach|fig|olive|pomegranate|fruit|tree/i.test(
            `${p.name} ${p.species}`
          )
      );
      if (hasFruitTree) unlocked.add("fruit-tree-owner");

      for (const path of ACADEMY_PATHS) {
        const { percent } = getPathProgress(path.id, prev.completedLessons);
        if (percent === 100 && path.certificateId) {
          certs.add(path.certificateId);
        }
        if (percent === 100) {
          if (path.id === "soil-mastery") unlocked.add("compost-hero");
          if (path.id === "garden-bugs") unlocked.add("bug-hunter");
          if (path.id === "water-mastery") unlocked.add("water-master");
          if (path.id === "plant-health") unlocked.add("plant-doctor");
          if (path.id === "bonsai") unlocked.add("bonsai-beginner");
        }
      }

      if (certs.size >= 5) unlocked.add("master-gardener");
      if (certs.size === ACADEMY_PATHS.length) certs.add("cert-master-gardener");

      const next = {
        ...prev,
        unlockedBadges: [...unlocked],
        earnedCertificates: [...certs],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [plants, stats.scans]);

  const updateStreak = useCallback(() => {
    const today = todayKey();
    setProgress((prev) => {
      if (prev.lastActiveDate === today) return prev;
      let streak = 1;
      if (prev.lastActiveDate === yesterdayKey()) {
        streak = prev.currentStreak + 1;
      }
      const next = {
        ...prev,
        currentStreak: streak,
        longestStreak: Math.max(prev.longestStreak, streak),
        lastActiveDate: today,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

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
        xpLog: [{ type: "daily_login" as XpEventType, amount, at: new Date().toISOString() }, ...prev.xpLog.slice(0, 49)],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [updateStreak]);

  const completeLesson = useCallback(
    (lessonId: string) => {
      updateStreak();
      setProgress((prev) => {
        if (prev.completedLessons.includes(lessonId)) return prev;
        const lessonXp = xpForEvent("lesson_completed");
        const quizXp = xpForEvent("quiz_passed");
        const next = {
          ...prev,
          completedLessons: [...prev.completedLessons, lessonId],
          passedQuizzes: [...new Set([...prev.passedQuizzes, lessonId])],
          totalXp: prev.totalXp + lessonXp + quizXp,
          xpLog: [
            {
              type: "quiz_passed" as XpEventType,
              amount: quizXp,
              at: new Date().toISOString(),
            },
            {
              type: "lesson_completed" as XpEventType,
              amount: lessonXp,
              at: new Date().toISOString(),
            },
            ...prev.xpLog.slice(0, 48),
          ],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        localStorage.setItem(
          "plantpal-education",
          JSON.stringify({
            completedLessons: next.completedLessons,
            passedQuizzes: next.passedQuizzes,
          })
        );
        return next;
      });
      toast("+75 XP — lesson complete!");
    },
    [toast, updateStreak]
  );

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
        awardXp,
        completeLesson,
        isLessonComplete,
        continueLessonId,
        toggleFamilyMode,
        badges: ACADEMY_BADGES,
        syncBadgesAndCertificates,
        recordDailyLogin,
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

/** Award XP from other providers (plants, scans, etc.) */
export function useAcademyXp() {
  const ctx = useContext(AcademyContext);
  return ctx?.awardXp ?? (() => 0);
}

export { ACADEMY_CERTIFICATES };

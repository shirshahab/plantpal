"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { EducationProgress } from "@/lib/education/types";
import { getNextLevelInfo } from "@/lib/education/utils";
import { readLocalJson } from "@/lib/storage/safe-local-storage";

const STORAGE_KEY = "plantpal-education";

const defaultProgress: EducationProgress = {
  completedLessons: [],
  passedQuizzes: [],
};

interface EducationContextValue {
  progress: EducationProgress;
  loading: boolean;
  completeLesson: (lessonId: string) => void;
  isLessonComplete: (lessonId: string) => boolean;
  levelInfo: ReturnType<typeof getNextLevelInfo>;
}

const EducationContext = createContext<EducationContextValue | null>(null);

export function EducationProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<EducationProgress>(defaultProgress);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProgress(readLocalJson(STORAGE_KEY, defaultProgress));
    setLoading(false);
  }, []);

  const persist = useCallback((next: EducationProgress) => {
    setProgress(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const completeLesson = useCallback(
    (lessonId: string) => {
      if (progress.completedLessons.includes(lessonId)) return;
      persist({
        completedLessons: [...progress.completedLessons, lessonId],
        passedQuizzes: [...new Set([...progress.passedQuizzes, lessonId])],
      });
    },
    [progress, persist]
  );

  const isLessonComplete = useCallback(
    (lessonId: string) => progress.completedLessons.includes(lessonId),
    [progress.completedLessons]
  );

  const levelInfo = getNextLevelInfo(progress.completedLessons.length);

  return (
    <EducationContext.Provider
      value={{ progress, loading, completeLesson, isLessonComplete, levelInfo }}
    >
      {children}
    </EducationContext.Provider>
  );
}

export function useEducation() {
  const ctx = useContext(EducationContext);
  if (!ctx) throw new Error("useEducation must be used within EducationProvider");
  return ctx;
}

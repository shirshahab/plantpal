"use client";

import Link from "next/link";
import { GraduationCap, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAcademy } from "@/lib/store/academy-provider";
import { getAcademyLessonById } from "@/lib/academy/lessons";
import { RANK_EMOJI } from "@/lib/academy/ranks";

export function ContinueLearningWidget() {
  const { progress, rankInfo, continueLessonId } = useAcademy();
  const lesson = continueLessonId ? getAcademyLessonById(continueLessonId) : null;

  if (!lesson) return null;

  return (
    <Card padding="md" className="border-brand-sage/40 bg-gradient-to-br from-green-50/80 to-white">
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="w-4 h-4 text-brand-primary" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Continue Learning
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-100">
          <span>{RANK_EMOJI[rankInfo.rank]}</span>
          <span className="text-sm font-medium text-gray-900">{rankInfo.rank}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-700">
            {progress.currentStreak} day streak
          </span>
        </div>
        {rankInfo.xpToNextRank > 0 && (
          <span className="text-xs text-gray-500">
            {rankInfo.xpToNextRank} XP to next rank
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">{lesson.icon}</span>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Next lesson</p>
            <p className="font-semibold text-gray-900 truncate">{lesson.title}</p>
            <p className="text-xs text-gray-400">{lesson.estimatedMinutes} min · +75 XP</p>
          </div>
        </div>
        <Link href={`/academy/lesson/${lesson.id}`} className="shrink-0">
          <Button size="sm">Continue</Button>
        </Link>
      </div>
    </Card>
  );
}

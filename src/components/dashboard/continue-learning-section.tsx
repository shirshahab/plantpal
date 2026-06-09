"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoatProgressBar } from "@/components/moat/moat-progress";
import { useAcademy } from "@/lib/store/academy-provider";
import { getAcademyLessonById } from "@/lib/academy/lessons";
import { RANK_EMOJI } from "@/lib/academy/ranks";

export function DashboardContinueLearning() {
  const { progress, rankInfo, continueLessonId, loading } = useAcademy();
  const lesson = continueLessonId ? getAcademyLessonById(continueLessonId) : null;

  if (loading) return null;

  return (
    <Card padding="md" className="border-green-100 bg-gradient-to-br from-green-50/60 to-white">
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="w-4 h-4 text-green-600" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Continue learning
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-100 px-3 py-1 text-sm font-medium">
          {RANK_EMOJI[rankInfo.rank]} {rankInfo.rank}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-100 px-3 py-1 text-sm font-medium text-green-700">
          {progress.totalXp.toLocaleString()} XP
        </span>
        {progress.currentStreak > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
            <Flame className="w-3.5 h-3.5" />
            {progress.currentStreak}d streak
          </span>
        )}
      </div>

      {rankInfo.xpToNextRank > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress to next rank</span>
            <span>{rankInfo.xpToNextRank} XP to go</span>
          </div>
          <MoatProgressBar value={rankInfo.progressPercent} max={100} color="green" />
        </div>
      )}

      {lesson ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">{lesson.icon}</span>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Next lesson</p>
              <p className="font-semibold text-gray-900 truncate">{lesson.title}</p>
            </div>
          </div>
          <Link href={`/academy/lesson/${lesson.id}`} className="shrink-0">
            <Button size="sm">
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <Link href="/academy">
          <Button variant="secondary" size="sm" className="w-full">
            Explore Academy
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      )}
    </Card>
  );
}

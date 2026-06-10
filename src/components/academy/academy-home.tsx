"use client";

import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Planty, StreakFlame, XpBar } from "@/components/academy/planty";
import { useAcademy } from "@/lib/store/academy-provider";
import { ACADEMY_PATHS } from "@/lib/academy/paths";
import { getAcademyLessonById } from "@/lib/academy/lessons";
import { RANK_EMOJI } from "@/lib/academy/ranks";
import { cn } from "@/lib/utils";

export function AcademyHomeHero() {
  const { progress, rankInfo, levelProgress, continueLessonId } = useAcademy();
  const continueLesson = continueLessonId ? getAcademyLessonById(continueLessonId) : null;

  return (
    <div className="space-y-4">
      <Card padding="md" className="bg-gradient-to-br from-brand-primary to-[#1e4d38] text-white border-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-green-200 text-xs font-medium uppercase tracking-wide">Your rank</p>
              <p className="text-2xl font-bold font-heading flex items-center gap-2 mt-1">
                <span>{RANK_EMOJI[rankInfo.rank]}</span>
                {rankInfo.rank}
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-200 text-xs">Total XP</p>
              <p className="text-2xl font-bold tabular-nums">{progress.totalXp}</p>
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <XpBar
              current={levelProgress.current}
              needed={levelProgress.needed}
              level={levelProgress.level}
              className="[&_span]:text-green-100"
            />
          </div>
          <StreakFlame days={progress.currentStreak} className="text-orange-200" />
        </div>
      </Card>

      {continueLesson && (
        <Card padding="md" className="border-brand-sage/40">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Continue learning
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-3xl">{continueLesson.icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{continueLesson.title}</p>
                <p className="text-xs text-gray-500">{continueLesson.estimatedMinutes} min · +75 XP</p>
              </div>
            </div>
            <Link href={`/academy/lesson/${continueLesson.id}`}>
              <Button size="sm">Continue</Button>
            </Link>
          </div>
        </Card>
      )}

      <Planty mood="welcome" />
    </div>
  );
}

export function PathCard({
  pathId,
  completed,
  total,
  percent,
}: {
  pathId: string;
  completed: number;
  total: number;
  percent: number;
}) {
  const path = ACADEMY_PATHS.find((p) => p.id === pathId);
  if (!path) return null;

  return (
    <Link href={`/academy/${path.id}`}>
      <Card
        padding="md"
        className="hover:border-brand-primary/40 transition-colors touch-manipulation h-full"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: `${path.color}20` }}
          >
            {path.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{path.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{path.description}</p>
            <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${percent}%`, backgroundColor: path.color }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {completed}/{total} lessons
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
        </div>
      </Card>
    </Link>
  );
}

export function RecentBadgesRow() {
  const { progress, badges } = useAcademy();
  const recent = badges
    .filter((b) => progress.unlockedBadges.includes(b.id))
    .slice(0, 4);

  if (recent.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Recent badges</h2>
        <Link href="/academy/trophies" className="text-xs text-brand-primary font-medium flex items-center gap-1">
          Trophy Room <Trophy className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {recent.map((badge) => (
          <div
            key={badge.id}
            className="shrink-0 flex flex-col items-center gap-1 w-20 p-2 rounded-xl bg-amber-50 border border-amber-100"
          >
            <span className="text-2xl">{badge.icon}</span>
            <span className="text-[10px] font-medium text-center text-gray-700 leading-tight">
              {badge.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FamilyLeaderboard() {
  const { progress } = useAcademy();
  if (!progress.familyMode) return null;

  return (
    <Card padding="md" className="border-purple-100 bg-purple-50/30">
      <p className="text-sm font-semibold text-gray-900 mb-1">👨‍👩‍👧 Family leaderboard</p>
      <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-white border border-purple-200 font-medium mt-2">
        <span>#1 You</span>
        <span className="tabular-nums">{progress.totalXp} XP</span>
      </div>
      <Link
        href="/family"
        className="text-xs text-purple-700 font-medium mt-3 inline-block"
      >
        Invite family to compete →
      </Link>
    </Card>
  );
}

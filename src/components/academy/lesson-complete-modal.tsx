"use client";

import Link from "next/link";
import { Sparkles, Flame, Trophy, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Planty } from "@/components/academy/planty";
import { getAcademyLessonById } from "@/lib/academy/lessons";
import { ACADEMY_BADGES } from "@/lib/academy/badges";
import type { LessonCompleteResult } from "@/lib/academy/types";

interface LessonCompleteModalProps {
  result: LessonCompleteResult;
  onClose: () => void;
}

export function LessonCompleteModal({ result, onClose }: LessonCompleteModalProps) {
  const nextLesson = result.nextLessonId
    ? getAcademyLessonById(result.nextLessonId)
    : null;
  const newBadgeDetails = result.newBadges
    .map((id) => ACADEMY_BADGES.find((b) => b.id === id))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card padding="lg" className="w-full max-w-md relative animate-in fade-in slide-in-from-bottom-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">Lesson Complete!</h2>

          <div className="flex justify-center gap-4">
            <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-green-50 border border-green-100">
              <Sparkles className="w-5 h-5 text-green-600 mb-1" />
              <span className="text-lg font-bold text-green-700">+{result.xpEarned} XP</span>
            </div>
            <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-orange-50 border border-orange-100">
              <Flame className="w-5 h-5 text-orange-500 mb-1" />
              <span className="text-lg font-bold text-orange-700">{result.streak} day streak</span>
            </div>
          </div>

          {result.streakMilestone && (
            <Planty
              mood="celebrate"
              message={`🔥 ${result.streakMilestone}-day streak milestone! You're building a real habit.`}
            />
          )}

          {newBadgeDetails.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <p className="font-semibold text-amber-900">Badge Unlocked!</p>
              </div>
              {newBadgeDetails.map((badge) => (
                <div key={badge!.id} className="flex items-center gap-3 justify-center">
                  <span className="text-3xl">{badge!.icon}</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{badge!.title}</p>
                    <p className="text-xs text-gray-500">{badge!.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {nextLesson && (
            <div className="text-left rounded-xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Up next
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{nextLesson.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{nextLesson.title}</p>
                  <p className="text-xs text-gray-500">{nextLesson.estimatedMinutes} min</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            {nextLesson && result.pathId && (
              <Link href={`/academy/lesson/${nextLesson.id}`} onClick={onClose}>
                <Button className="w-full">
                  Continue path
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <Link href={result.pathId ? `/academy/${result.pathId}` : "/academy"} onClick={onClose}>
              <Button variant="secondary" className="w-full">
                Back to path
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

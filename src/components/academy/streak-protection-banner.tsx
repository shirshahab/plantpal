"use client";

import { AlertTriangle, Snowflake } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAcademy } from "@/lib/store/academy-provider";

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StreakProtectionBanner() {
  const {
    progress,
    isStreakAtRisk,
    useStreakFreeze,
  } = useAcademy();

  if (progress.currentStreak === 0 && !isStreakAtRisk) return null;

  const atRisk = isStreakAtRisk();
  const missedYesterday =
    progress.lastActiveDate &&
    progress.lastActiveDate < yesterdayKey() &&
    progress.lastActiveDate !== todayKey();

  if (!atRisk && !missedYesterday) return null;

  if (missedYesterday && progress.streakFreezes > 0) {
    return (
      <Card padding="md" className="border-blue-200 bg-blue-50/60">
        <div className="flex items-start gap-3">
          <Snowflake className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Streak at risk!</p>
            <p className="text-sm text-gray-600 mt-1">
              You missed a day. Use a streak freeze to protect your {progress.currentStreak}-day
              streak — or complete a lesson today to start fresh.
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={useStreakFreeze}
            >
              <Snowflake className="w-4 h-4" />
              Use streak freeze ({progress.streakFreezes} left)
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (atRisk) {
    return (
      <Card padding="md" className="border-orange-200 bg-orange-50/60">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">Keep your streak alive!</p>
            <p className="text-sm text-gray-600 mt-1">
              Complete a lesson today to extend your {progress.currentStreak}-day streak.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}

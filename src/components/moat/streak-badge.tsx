"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { STREAK_MILESTONES } from "@/lib/moat/community-missions";

export function StreakBadge({
  streak,
  className,
}: {
  streak: number;
  className?: string;
}) {
  const nextMilestone = STREAK_MILESTONES.find((m) => m > streak) ?? 100;
  const isHot = streak >= 7;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5",
        isHot
          ? "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100"
          : "bg-white border border-gray-100",
        className
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center",
          isHot ? "bg-orange-100" : "bg-gray-50"
        )}
      >
        <Flame className={cn("w-5 h-5", isHot ? "text-orange-500" : "text-gray-400")} />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900 leading-none">{streak}</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-wide">day streak</p>
      </div>
      <div className="ml-2 text-right">
        <p className="text-[10px] text-gray-400">Next</p>
        <p className="text-xs font-semibold text-green-600">{nextMilestone} days</p>
      </div>
    </div>
  );
}

export function StreakMilestones({ streak }: { streak: number }) {
  return (
    <div className="flex gap-2">
      {STREAK_MILESTONES.map((m) => {
        const earned = streak >= m;
        return (
          <div
            key={m}
            className={cn(
              "flex-1 rounded-xl py-2 px-1 text-center text-xs font-semibold transition-colors",
              earned
                ? "bg-green-100 text-green-700"
                : "bg-gray-50 text-gray-400"
            )}
          >
            {m}d
          </div>
        );
      })}
    </div>
  );
}

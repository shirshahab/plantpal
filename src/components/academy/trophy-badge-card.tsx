"use client";

import { cn } from "@/lib/utils";
import type { AcademyBadge } from "@/lib/academy/types";

interface TrophyBadgeCardProps {
  badge: AcademyBadge;
  unlocked: boolean;
  progress?: number;
}

export function TrophyBadgeCard({ badge, unlocked, progress = 0 }: TrophyBadgeCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center p-4 rounded-2xl border transition-all",
        unlocked
          ? "bg-amber-50 border-amber-200 shadow-sm"
          : "bg-gray-50 border-gray-200 opacity-70 grayscale"
      )}
    >
      <span className={cn("text-4xl mb-2", !unlocked && "opacity-40")}>{badge.icon}</span>
      <p className="text-sm font-semibold text-gray-900">{badge.title}</p>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{badge.description}</p>
      {!unlocked && badge.target && (
        <div className="w-full mt-3">
          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-brand-primary rounded-full"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}
      {unlocked && (
        <span className="mt-2 text-[10px] font-semibold uppercase text-amber-700">Unlocked</span>
      )}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import type { AcademyBadge } from "@/lib/academy/types";
import {
  getBadgeRarity,
  getUnlockHint,
  RARITY_STYLES,
  type BadgeRarity,
} from "@/lib/academy/badge-progress";

const RARITY_LABEL: Record<BadgeRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

interface TrophyBadgeCardProps {
  badge: AcademyBadge;
  unlocked: boolean;
  progress?: number;
  progressLabel?: string;
  unlockedAt?: string | null;
}

export function TrophyBadgeCard({
  badge,
  unlocked,
  progress = 0,
  progressLabel,
  unlockedAt,
}: TrophyBadgeCardProps) {
  const rarity = getBadgeRarity(badge.id);
  const hint = getUnlockHint(badge);

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center p-4 rounded-2xl border transition-all",
        unlocked ? RARITY_STYLES[rarity] : "bg-gray-50 border-gray-200 opacity-75"
      )}
    >
      <span
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider mb-2 px-2 py-0.5 rounded-full",
          unlocked ? "text-gray-600 bg-white/80" : "text-gray-400 bg-gray-100"
        )}
      >
        {RARITY_LABEL[rarity]}
      </span>
      <span className={cn("text-4xl mb-2", !unlocked && "grayscale opacity-50")}>
        {badge.icon}
      </span>
      <p className="text-sm font-semibold text-gray-900">{badge.title}</p>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{badge.description}</p>
      <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">{hint}</p>

      {!unlocked && (
        <div className="w-full mt-3">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Progress</span>
            <span>{progressLabel ?? `${Math.min(100, progress)}%`}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-brand-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}

      {unlocked && (
        <span className="mt-2 text-[10px] font-semibold uppercase text-brand-primary">
          {unlockedAt
            ? `Unlocked ${new Date(unlockedAt).toLocaleDateString()}`
            : "Unlocked"}
        </span>
      )}
    </div>
  );
}

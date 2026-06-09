"use client";

import { Check, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoatProgressBar } from "./moat-progress";
import type { CommunityMission } from "@/lib/moat/community-missions";
import { cn } from "@/lib/utils";

export function MissionCard({
  mission,
  onComplete,
}: {
  mission: CommunityMission;
  onComplete: (id: string) => void;
}) {
  const done = mission.status === "completed" || mission.status === "claimed";
  const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));

  return (
    <Card
      padding="md"
      className={cn(
        "transition-all duration-300",
        done ? "bg-green-50/80 border-green-100" : "hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-xl shrink-0 shadow-sm">
          {done ? <Check className="w-5 h-5 text-green-600" /> : mission.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900">{mission.title}</p>
            <span className="text-xs font-bold text-green-600 shrink-0">+{mission.rewardXp} XP</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{mission.description}</p>
          <div className="mt-3 space-y-1.5">
            <MoatProgressBar value={mission.progress} max={mission.target} />
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>
                {mission.progress}/{mission.target}
              </span>
              <span>{pct}%</span>
            </div>
          </div>
          {mission.rewardBadge && (
            <p className="text-[10px] text-amber-600 font-medium mt-2 flex items-center gap-1">
              <Gift className="w-3 h-3" /> Badge: {mission.rewardBadge}
            </p>
          )}
        </div>
      </div>
      {!done && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-3"
          onClick={() => onComplete(mission.id)}
        >
          Mark complete
        </Button>
      )}
    </Card>
  );
}

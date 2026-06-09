"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoatProgressBar } from "@/components/moat/moat-progress";
import { useActiveChallenges } from "@/lib/social/hooks";

export function DashboardActiveChallenge() {
  const { challenges, loading } = useActiveChallenges();
  const challenge = challenges[0];

  if (loading) return null;
  if (!challenge) return null;

  const progress = challenge.progress ?? 0;

  return (
    <Card padding="md" className="border-amber-100 bg-gradient-to-br from-amber-50/60 to-white">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-600 uppercase">Active challenge</p>
          <p className="font-bold text-gray-900 mt-0.5">{challenge.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{challenge.description}</p>
          <div className="mt-3">
            <MoatProgressBar value={progress} max={challenge.target} color="amber" />
            <p className="text-xs text-gray-500 mt-1">
              {progress}/{challenge.target} {challenge.unit}
            </p>
          </div>
          <p className="text-xs text-green-600 font-semibold mt-2">
            Reward: +{challenge.rewardXp} XP
            {challenge.rewardBadge ? ` · ${challenge.rewardBadge} badge` : ""}
          </p>
          <Link href="/missions" className="inline-block mt-3">
            <Button variant="secondary" size="sm" className="touch-manipulation">
              View challenges
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

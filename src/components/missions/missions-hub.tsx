"use client";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { MissionCard } from "@/components/moat/mission-card";
import { StreakBadge, StreakMilestones } from "@/components/moat/streak-badge";
import { useMoat } from "@/lib/store/moat-provider";

export function MissionsHub() {
  const { ready, missions, completeCommunityMission } = useMoat();

  if (!ready) {
    return (
      <div className="max-w-lg mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded-lg w-1/2" />
        <div className="h-20 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const dailyDone = missions.daily.filter((m) => m.status !== "pending").length;
  const weeklyDone = missions.weekly.filter((m) => m.status !== "pending").length;

  return (
    <div className="space-y-6 max-w-lg mx-auto page-enter">
      <PageHeader
        title="Community Missions"
        description="Daily & weekly goals — earn XP, badges, and trophies"
      />

      <div className="flex flex-col items-center gap-4">
        <StreakBadge streak={missions.streak.current} />
        <StreakMilestones streak={missions.streak.current} />
      </div>

      <Card padding="md" className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-700">
              {dailyDone}/{missions.daily.length}
            </p>
            <p className="text-xs text-gray-500">Daily complete</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700">
              {weeklyDone}/{missions.weekly.length}
            </p>
            <p className="text-xs text-gray-500">Weekly complete</p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          Longest streak: {missions.streak.longest} days
        </p>
      </Card>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Daily missions
        </p>
        <div className="space-y-3">
          {missions.daily.map((m) => (
            <MissionCard key={m.id} mission={m} onComplete={completeCommunityMission} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Weekly missions
        </p>
        <div className="space-y-3">
          {missions.weekly.map((m) => (
            <MissionCard key={m.id} mission={m} onComplete={completeCommunityMission} />
          ))}
        </div>
      </div>
    </div>
  );
}

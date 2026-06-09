"use client";

import Link from "next/link";
import { ListChecks, CheckCircle2, Circle, SkipForward } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Plant } from "@/lib/types";
import { useJourney } from "@/lib/store/journey-provider";
import { useToast } from "@/lib/store/toast-provider";

interface TodaysMissionsWidgetProps {
  plants: Plant[];
}

export function TodaysMissionsWidget({ plants }: TodaysMissionsWidgetProps) {
  const { getTodaysMissions, completeMission, skipMission, ready } = useJourney();
  const { toast } = useToast();

  if (!ready || plants.length === 0) return null;

  const missions = getTodaysMissions(plants).slice(0, 5);

  if (missions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Missions</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            All caught up! Add goals to your plants to get personalized missions.
          </p>
        </CardContent>
      </Card>
    );
  }

  function plantName(plantId: string) {
    return plants.find((p) => p.id === plantId)?.name ?? "Your plant";
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Missions</h2>
          </div>
          <span className="text-xs text-gray-400">{missions.length} active</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Do this next — quick wins for your garden.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
          >
            <Circle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{mission.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{mission.description}</p>
              <Link
                href={`/plants/${mission.plantId}`}
                className="text-xs text-green-600 font-medium mt-1 inline-block"
              >
                View {plantName(mission.plantId)} →
              </Link>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  completeMission(mission.id);
                  toast("Mission complete! +" + mission.rewardPoints + " pts");
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Skip"
                onClick={() => skipMission(mission.id)}
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

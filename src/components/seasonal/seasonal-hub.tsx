"use client";

import { Check, Leaf } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoat } from "@/lib/store/moat-provider";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { SEASONAL_ILLUSTRATIONS } from "@/lib/moat/seasonal-engine";
import type { SeasonalHorizon, SeasonalTask } from "@/lib/moat/seasonal-engine";
import { cn } from "@/lib/utils";

function seasonKey(): keyof typeof SEASONAL_ILLUSTRATIONS {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

function TaskSection({
  title,
  tasks,
  completedIds,
  onComplete,
}: {
  title: string;
  tasks: SeasonalTask[];
  completedIds: string[];
  onComplete: (id: string) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
        {title}
      </p>
      <div className="space-y-2">
        {tasks.map((task) => {
          const done = completedIds.includes(task.id);
          return (
            <Card
              key={task.id}
              padding="md"
              className={cn(done && "bg-green-50/60 border-green-100")}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{task.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                </div>
                {done ? (
                  <Check className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => onComplete(task.id)}>
                    Done
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function SeasonalHub() {
  const { ready, seasonalGrouped, completedSeasonalIds, completeSeasonalTask, plantLabels } =
    useMoat();
  const profile = loadUserProfile();
  const season = seasonKey();
  const location = profile.zipCode || "your area";

  if (!ready) {
    return (
      <div className="max-w-lg mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded-lg w-2/3" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const horizons: { key: SeasonalHorizon; title: string }[] = [
    { key: "today", title: "Today" },
    { key: "week", title: "This Week" },
    { key: "month", title: "This Month" },
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto page-enter">
      <PageHeader
        title="Seasonal Engine"
        description={`Personalized tasks for ${location} · powered by your garden map`}
      />

      <Card padding="md" className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-sky-50 opacity-80" />
        <div className="relative flex items-center gap-4">
          <span className="text-6xl">{SEASONAL_ILLUSTRATIONS[season]}</span>
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase">Current season</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">{season}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Leaf className="w-3.5 h-3.5 text-green-500" />
              {plantLabels.length} plants in your map
            </p>
          </div>
        </div>
      </Card>

      {horizons.map(({ key, title }) => (
        <TaskSection
          key={key}
          title={title}
          tasks={seasonalGrouped[key]}
          completedIds={completedSeasonalIds}
          onComplete={completeSeasonalTask}
        />
      ))}
    </div>
  );
}

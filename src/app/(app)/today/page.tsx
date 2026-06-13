"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/task-card";
import { PlantyLine } from "@/components/planty/planty-line";
import { useTasks } from "@/lib/store/tasks-provider";
import { usePlants } from "@/lib/store/plants-provider";
import { getTodayFocusTasks, todayFocusCopy } from "@/lib/tasks/dedupe-tasks";
import {
  pickPlantyMessage,
  buildPlantySignalsFromWeather,
} from "@/lib/copy/planty-messages-system";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { lookupZipRecord } from "@/lib/location/usda-zones";
import { useWeather } from "@/lib/hooks/use-weather";
import { InstallPrompt } from "@/components/mobile/install-prompt";
import { SyncStatusBadge } from "@/components/sync/sync-status-badge";

export default function TodayPage() {
  const { plants, loading: plantsLoading } = usePlants();
  const { groups, ready, completeTask, snoozeTask } = useTasks();

  const focusTasks =
    ready && plants.length > 0 ? getTodayFocusTasks(groups, plants) : [];
  const completedToday = groups.completed.filter((t) => {
    if (!t.completedAt) return false;
    const d = new Date(t.completedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const zip = loadUserProfile().zipCode || plants[0]?.zipCode || "91107";
  const record = lookupZipRecord(zip);
  const { weather } = useWeather(zip);

  const plantyMessage = useMemo(() => {
    return pickPlantyMessage("today_tasks", {
      taskCount: focusTasks.length,
      city: record.city,
      zone: record.usdaZone,
      plantCount: plants.length,
      userId: loadUserProfile().zipCode || undefined,
      signals: buildPlantySignalsFromWeather(weather?.alerts ?? [], {
        plantCount: plants.length,
      }),
    });
  }, [focusTasks.length, plants.length, record.city, record.usdaZone, weather?.alerts]);
  if (plantsLoading || !ready) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-lg w-1/2" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader
        title="Today"
        description={todayFocusCopy(focusTasks.length)}
        action={
          <div className="flex items-center gap-2">
            <SyncStatusBadge />
            <Link href="/calendar">
              <Button variant="secondary" size="sm">
                <CalendarDays className="w-4 h-4" />
                Calendar
              </Button>
            </Link>
          </div>
        }
      />

      {plants.length > 0 && (
        <PlantyLine message={plantyMessage} className="-mt-2" linkable={Boolean(plantyMessage.target)} />
      )}
      <InstallPrompt />

      {plants.length === 0 ? (
        <EmptyState
          icon="🪴"
          title="Let's add your first plant."
          description="Your daily tasks, watering reminders, and care schedule start here."
          actionLabel="Scan Plant"
          actionHref="/scanner"
          secondaryLabel="Add Plant Manually"
          secondaryHref="/plants/new"
        />
      ) : focusTasks.length === 0 ? (
        <EmptyState
          icon="✨"
          compact
          title="Nothing urgent today."
          description={plantyMessage.text}
          actionLabel="View Calendar"
          actionHref="/calendar"
        />
      ) : (
        <>
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3 px-0.5">
              What matters today
            </h2>
            <div className="space-y-3">
              {focusTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={completeTask}
                  onSnooze={snoozeTask}
                  compact
                />
              ))}
            </div>
          </section>

          {completedToday.length > 0 && (
            <section className="pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Done today
              </p>
              <ul className="space-y-1">
                {completedToday.slice(0, 2).map((t) => (
                  <li key={t.id} className="text-sm text-gray-500 line-through decoration-gray-300">
                    {t.title}
                  </li>
                ))}
              </ul>
              {completedToday.length > 2 && (
                <Link href="/calendar" className="text-xs text-green-600 mt-1 inline-block">
                  +{completedToday.length - 2} more on Calendar
                </Link>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

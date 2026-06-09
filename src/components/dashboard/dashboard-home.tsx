"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { InstallPrompt } from "@/components/mobile/install-prompt";
import { DemoBanner } from "@/components/demo/demo-banner";
import { SyncStatusBadge } from "@/components/sync/sync-status-badge";
import { DashboardHealthScore } from "@/components/dashboard/health-score-section";
import { DashboardTopTasks } from "@/components/dashboard/top-tasks-section";
import { DashboardSeasonalAlert } from "@/components/dashboard/seasonal-alert-section";
import { DashboardContinueLearning } from "@/components/dashboard/continue-learning-section";
import { DashboardQuickActions } from "@/components/dashboard/quick-actions-section";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { FounderModeBadge } from "@/components/settings/founder-mode-badge";
import { SendFeedbackButton } from "@/components/feedback/send-feedback-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePlants } from "@/lib/store/plants-provider";
import { useTasks } from "@/lib/store/tasks-provider";
import { useMoat } from "@/lib/store/moat-provider";
import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh";
import { useToast } from "@/lib/store/toast-provider";

export function DashboardHome() {
  const { plants, loading, refreshPlants } = usePlants();
  const { topTasks, completeTask, skipTask, snoozeTask, ready: tasksReady } = useTasks();
  const { gardenHealth, seasonalTasks, ready: moatReady } = useMoat();
  const { toast } = useToast();

  const { refreshing, onTouchStart, onTouchEnd } = usePullToRefresh(async () => {
    await refreshPlants();
    toast("Garden refreshed");
  });

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  if (loading || !moatReady) {
    return <DashboardSkeleton />;
  }

  if (plants.length === 0) {
    return <DashboardEmptyState />;
  }

  return (
    <div
      className="max-w-lg mx-auto pb-4"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {refreshing && (
        <div className="text-center text-xs text-green-600 font-medium py-1 mb-2">
          Refreshing…
        </div>
      )}

      <PageHeader
        title={`${greeting}`}
        description={`${plants.length} plant${plants.length === 1 ? "" : "s"} in your garden`}
        action={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <SendFeedbackButton />
            <FounderModeBadge />
            <SyncStatusBadge />
          </div>
        }
        className="mb-5"
      />

      <InstallPrompt />
      <DemoBanner />

      <div className="flex flex-col gap-5">
        <DashboardHealthScore health={gardenHealth} plants={plants} />
        <DashboardTopTasks
          tasks={topTasks}
          ready={tasksReady}
          onComplete={completeTask}
          onSkip={skipTask}
          onSnooze={snoozeTask}
        />
        {!tasksReady || topTasks.length === 0 ? (
          <Card padding="md" className="text-center">
            <p className="text-sm text-gray-600">No tasks due today — your garden is on track.</p>
            <Link href="/today" className="inline-block mt-3">
              <Button variant="outline" size="sm" className="touch-manipulation">
                View calendar <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </Card>
        ) : null}
        <DashboardSeasonalAlert plants={plants} seasonalTasks={seasonalTasks} />
        <DashboardContinueLearning />
        <DashboardQuickActions />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { InstallPrompt } from "@/components/mobile/install-prompt";
import { SyncStatusBadge } from "@/components/sync/sync-status-badge";
import { DashboardHealthScore } from "@/components/dashboard/health-score-section";
import { DashboardGardenTasks } from "@/components/dashboard/garden-tasks-section";
import { DashboardSeasonalAlert } from "@/components/dashboard/seasonal-alert-section";
import { DashboardHealthAlert } from "@/components/dashboard/health-alert-section";
import { DashboardRecentNotifications } from "@/components/dashboard/recent-notifications-section";
import { DashboardContinueLearning } from "@/components/dashboard/continue-learning-section";
import { DashboardQuickActions } from "@/components/dashboard/quick-actions-section";
import { DashboardNeedsAttention } from "@/components/dashboard/needs-attention-section";
import { DashboardTrending } from "@/components/dashboard/trending-section";
import { DashboardSuggestions } from "@/components/dashboard/suggestions-section";
import { DailyLessonCard } from "@/components/academy/daily-lesson-card";
import { DashboardActivityFeed } from "@/components/social/dashboard-activity-feed";
import { DashboardActiveChallenge } from "@/components/social/dashboard-active-challenge";
import { GrowersNearYou } from "@/components/dashboard/growers-near-you";
import { useDashboardIntelligence } from "@/lib/hooks/use-dashboard-intelligence";
import { InviteFriendsCard } from "@/components/dashboard/invite-friends-card";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { PlantyGreetingCard } from "@/components/dashboard/planty-greeting-card";
import { FounderModeBadge } from "@/components/settings/founder-mode-badge";
import { SendFeedbackButton } from "@/components/feedback/send-feedback-button";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { TasksDebug } from "@/components/dev/tasks-debug";
import { TrialBanner } from "@/components/billing/trial-banner";
import { usePlants } from "@/lib/store/plants-provider";
import { useTasks } from "@/lib/store/tasks-provider";
import { useMoat } from "@/lib/store/moat-provider";
import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh";
import { useToast } from "@/lib/store/toast-provider";
import { loadUserProfile } from "@/lib/profile/user-profile";

export function DashboardHome() {
  const { plants, loading, refreshPlants } = usePlants();
  const { groups: taskGroups, completeTask, ready: tasksReady } = useTasks();
  const { gardenHealth, seasonalTasks, ready: moatReady } = useMoat();
  const { toast } = useToast();
  const [profileZip, setProfileZip] = useState("");

  useEffect(() => {
    setProfileZip(loadUserProfile().zipCode);
  }, []);

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

  const zipCode = profileZip || plants[0]?.zipCode || "";
  const { context: dashboardIntel } = useDashboardIntelligence(zipCode);

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
            <NotificationCenter />
            <SendFeedbackButton />
            <FounderModeBadge />
            <SyncStatusBadge />
          </div>
        }
        className="mb-5"
      />

      <InstallPrompt />

      <div className="flex flex-col gap-5">
        <PlantyGreetingCard />

        <TrialBanner />

        {/* 0. Plant health alert — active diagnosis reports come first */}
        <DashboardHealthAlert />

        {/* 0b. Latest reminders & alerts */}
        <DashboardRecentNotifications />

        {/* 1. Weather / local alert */}
        <DashboardSeasonalAlert plants={plants} seasonalTasks={seasonalTasks} />

        {/* 2. Garden score */}
        <DashboardHealthScore health={gardenHealth} plants={plants} />

        {/* 3. Today's tasks — grouped & capped so the garden feels under control */}
        <DashboardGardenTasks
          groups={taskGroups}
          plantCount={plants.length}
          ready={tasksReady}
          onComplete={completeTask}
        />

        {/* 4. Plants needing attention */}
        <DashboardNeedsAttention plants={plants} />

        {/* 5. Friends & family feed */}
        <DashboardActivityFeed />
        <DashboardActiveChallenge />

        {/* 5c. Invite friends */}
        <InviteFriendsCard />

        {/* 6. Today's lesson + academy progress */}
        <DailyLessonCard />
        <DashboardContinueLearning />

        {/* 7. Trending near you + local growers */}
        <DashboardTrending zipCode={zipCode} plants={plants} intelligence={dashboardIntel} />
        <GrowersNearYou zipCode={zipCode} intelligence={dashboardIntel} />

        {/* 8. Suggestions */}
        <DashboardSuggestions />

        <DashboardQuickActions />
      </div>

      <TasksDebug />
    </div>
  );
}

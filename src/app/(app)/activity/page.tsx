"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { DashboardActivityTimeline } from "@/components/dashboard/activity-timeline-section";
import { EmptyState } from "@/components/empty-state";
import { usePlants } from "@/lib/store/plants-provider";
import { useTasks } from "@/lib/store/tasks-provider";
import { useAcademy } from "@/lib/store/academy-provider";
import { useEngagement } from "@/lib/store/engagement-provider";
import { getScanHistory } from "@/lib/scanner/scan-history";
import { buildActivityFeed } from "@/lib/dashboard/activity-feed";
import { ACADEMY_BADGES } from "@/lib/academy/badges";

export default function ActivityPage() {
  const { plants, loading } = usePlants();
  const { careLogs } = useTasks();
  const { progress } = useAcademy();
  const { growthEntries } = useEngagement();

  const activityItems = useMemo(() => {
    const plantNameById = Object.fromEntries(plants.map((p) => [p.id, p.name]));
    const badgeUnlocks = progress.unlockedBadges.map((id) => {
      const badge = ACADEMY_BADGES.find((b) => b.id === id);
      return {
        id,
        title: badge?.title ?? id,
        at: progress.badgeUnlockedAt[id] ?? new Date().toISOString(),
      };
    });

    return buildActivityFeed({
      plants,
      scanHistory: getScanHistory(),
      careLogs,
      plantNameById,
      growthEntries,
      badgeUnlocks,
    });
  }, [plants, careLogs, growthEntries, progress.unlockedBadges, progress.badgeUnlockedAt]);

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-4">
      <PageHeader
        title="Garden activity"
        description="Recent scans, care logs, and milestones"
      />
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : activityItems.length === 0 ? (
        <EmptyState
          icon="📋"
          compact
          title="No activity yet"
          description="Scans, care logs, and badges will show up here as you use PlantPal."
          actionLabel="Add Plant"
          actionHref="/plants/new"
          secondaryLabel="Scan a plant"
          secondaryHref="/scanner"
        />
      ) : (
        <DashboardActivityTimeline items={activityItems} />
      )}
    </div>
  );
}

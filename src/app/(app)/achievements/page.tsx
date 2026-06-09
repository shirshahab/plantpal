"use client";

import { PageHeader } from "@/components/page-header";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { EmptyState } from "@/components/empty-state";
import { useEngagement } from "@/lib/store/engagement-provider";

export default function AchievementsPage() {
  const { achievements } = useEngagement();
  const unlocked = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Achievements"
        description={`${unlocked} of ${achievements.length} unlocked — keep growing!`}
      />
      {unlocked === 0 ? (
        <EmptyState
          icon="🏆"
          title="No achievements yet"
          description="Complete your first plant task, add a plant, or take a growth photo to earn badges."
          actionLabel="View Today's Tasks"
          actionHref="/today"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      )}
    </div>
  );
}

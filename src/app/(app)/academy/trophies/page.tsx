"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { TrophyBadgeCard } from "@/components/academy/trophy-badge-card";
import { Planty } from "@/components/academy/planty";
import { useAcademy, ACADEMY_CERTIFICATES } from "@/lib/store/academy-provider";
import { usePlants } from "@/lib/store/plants-provider";
import { useEngagement } from "@/lib/store/engagement-provider";
import { getBadgeProgress } from "@/lib/academy/badge-progress";
import { Card } from "@/components/ui/card";

export default function TrophyRoomPage() {
  const { loading, progress, badges } = useAcademy();
  const { plants } = usePlants();
  const { stats } = useEngagement();

  if (loading) {
    return <LoadingState fullPage message="Loading trophies…" />;
  }

  const unlockedCount = progress.unlockedBadges.length;

  return (
    <div className="space-y-8 pb-8">
      <Link
        href="/academy"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Academy
      </Link>

      <PageHeader
        title="Trophy Room"
        description={`${unlockedCount} of ${badges.length} badges unlocked`}
      />

      <Planty
        mood={unlockedCount > 0 ? "celebrate" : "tip"}
        message={
          unlockedCount > 0
            ? `You've earned ${unlockedCount} badges — each one marks real skill.`
            : "Complete lessons and care for plants to earn your first badge."
        }
      />

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Badges
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {badges.map((badge) => {
            const unlocked = progress.unlockedBadges.includes(badge.id);
            const { current, target, percent } = getBadgeProgress(
              badge,
              progress,
              plants.length,
              stats.scans
            );
            return (
              <TrophyBadgeCard
                key={badge.id}
                badge={badge}
                unlocked={unlocked}
                progress={percent}
                progressLabel={unlocked ? undefined : `${current}/${target}`}
                unlockedAt={progress.badgeUnlockedAt?.[badge.id]}
              />
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Certificates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACADEMY_CERTIFICATES.map((cert) => {
            const earned = progress.earnedCertificates.includes(cert.id);
            return (
              <Card
                key={cert.id}
                padding="md"
                className={earned ? "border-brand-primary/30 bg-green-50/40" : "opacity-60"}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{cert.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{cert.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{cert.description}</p>
                    {earned && (
                      <p className="text-xs font-medium text-brand-primary mt-2">Earned ✓</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

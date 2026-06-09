"use client";

import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import {
  AcademyHomeHero,
  PathCard,
  RecentBadgesRow,
  FamilyLeaderboard,
} from "@/components/academy/academy-home";
import { useAcademy } from "@/lib/store/academy-provider";
import { ACADEMY_PATHS, getPathProgress } from "@/lib/academy/paths";

export default function AcademyPage() {
  const { loading, progress, toggleFamilyMode } = useAcademy();

  if (loading) {
    return <LoadingState fullPage message="Loading Academy…" />;
  }

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        title="PlantPal Academy"
        description="Level up your gardening skills — one fun lesson at a time."
        action={
          <Link href="/academy/trophies">
            <Button variant="outline" size="sm">
              <GraduationCap className="w-4 h-4" />
              Trophies
            </Button>
          </Link>
        }
      />

      <AcademyHomeHero />

      <RecentBadgesRow />

      <FamilyLeaderboard />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Learning paths</h2>
        <Button variant="ghost" size="sm" onClick={toggleFamilyMode}>
          <Users className="w-4 h-4" />
          {progress.familyMode ? "Family mode on" : "Family mode"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ACADEMY_PATHS.map((path) => {
          const { completed, total, percent } = getPathProgress(
            path.id,
            progress.completedLessons
          );
          return (
            <PathCard
              key={path.id}
              pathId={path.id}
              completed={completed}
              total={total}
              percent={percent}
            />
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400">
        {progress.completedLessons.length} lessons completed · {progress.unlockedBadges.length}{" "}
        badges earned
      </p>
    </div>
  );
}

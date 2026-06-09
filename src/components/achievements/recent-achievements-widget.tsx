"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEngagement } from "@/lib/store/engagement-provider";
import { formatDate } from "@/lib/utils";

export function RecentAchievementsWidget() {
  const { achievements } = useEngagement();
  const recent = achievements
    .filter((a) => a.unlockedAt)
    .sort(
      (a, b) =>
        new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()
    )
    .slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900">Recent Achievements</h3>
        </div>
        <Link href="/achievements" className="text-xs text-green-600 font-medium">
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {recent.map((a) => (
          <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl bg-amber-50/50">
            <span className="text-xl">{a.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
              <p className="text-xs text-gray-400">
                {a.unlockedAt ? formatDate(a.unlockedAt) : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

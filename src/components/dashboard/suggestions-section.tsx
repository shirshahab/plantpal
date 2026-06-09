"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { usePlants } from "@/lib/store/plants-provider";
import { useAcademy } from "@/lib/store/academy-provider";
import { useEngagement } from "@/lib/store/engagement-provider";
import { useFriends } from "@/lib/social/hooks";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { getScanHistory } from "@/lib/scanner/scan-history";
import {
  buildDashboardSuggestions,
  type DashboardSuggestion,
} from "@/lib/dashboard/suggestions";

export function DashboardSuggestions() {
  const { plants } = usePlants();
  const { progress } = useAcademy();
  const { growthEntries } = useEngagement();
  const { friends, loading: friendsLoading } = useFriends();
  const [suggestions, setSuggestions] = useState<DashboardSuggestion[]>([]);

  useEffect(() => {
    if (friendsLoading) return;
    setSuggestions(
      buildDashboardSuggestions({
        plants,
        profile: loadUserProfile(),
        completedLessons: progress.completedLessons,
        scanCount: getScanHistory().length,
        friendsCount: friends.length,
        growthPhotoCount: growthEntries.length,
      })
    );
  }, [plants, progress.completedLessons, growthEntries, friends, friendsLoading]);

  if (suggestions.length === 0) return null;

  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h2 className="text-base font-semibold text-gray-900">Suggestions for you</h2>
      </div>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <Link
            key={s.id}
            href={s.href}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-green-50/60 transition-colors touch-manipulation"
          >
            <span className="text-xl shrink-0">{s.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{s.title}</p>
              <p className="text-xs text-gray-500 truncate">{s.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          </Link>
        ))}
      </div>
    </Card>
  );
}

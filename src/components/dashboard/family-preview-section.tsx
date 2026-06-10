"use client";

import Link from "next/link";
import { ArrowRight, Heart, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAcademy } from "@/lib/store/academy-provider";
import { useMoat } from "@/lib/store/moat-provider";

export function DashboardFamilyPreview() {
  const { progress } = useAcademy();
  const { household } = useMoat();

  if (!progress.familyMode || !household) {
    return (
      <Card padding="md" className="border-pink-100 bg-gradient-to-br from-pink-50/40 to-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
            <Heart className="w-5 h-5 text-pink-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Grow together</p>
            <p className="text-sm text-gray-500 mt-1">
              Invite family, share XP, and compete on the leaderboard.
            </p>
            <Link href="/family" className="inline-block mt-3">
              <Button size="sm">
                Set up Family
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const sorted = household.members
    .map((m) => (m.id === "you" ? { ...m, totalXp: progress.totalXp } : m))
    .sort((a, b) => b.totalXp - a.totalXp);
  const totalXp = sorted.reduce((sum, m) => sum + m.totalXp, 0);

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-green-600" />
          <p className="text-xs font-semibold text-gray-400 uppercase">{household.name}</p>
        </div>
        <span className="text-xs font-bold text-green-600">
          {totalXp.toLocaleString()} XP
        </span>
      </div>
      <div className="space-y-2">
        {sorted.slice(0, 3).map((member, i) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
          >
            <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
            <span className="text-lg">{member.avatar}</span>
            <span className="flex-1 font-medium text-gray-900">{member.name}</span>
            <span className="text-sm font-bold text-green-600">
              {member.totalXp.toLocaleString()} XP
            </span>
          </div>
        ))}
      </div>
      <Link href="/family" className="inline-block mt-3">
        <Button variant="secondary" size="sm">
          View family dashboard
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </Card>
  );
}

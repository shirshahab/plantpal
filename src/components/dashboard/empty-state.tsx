"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Plus, ScanLine, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/mobile/install-prompt";
import { FounderModeBadge } from "@/components/settings/founder-mode-badge";
import { DashboardTrending } from "@/components/dashboard/trending-section";
import { DashboardSuggestions } from "@/components/dashboard/suggestions-section";
import { DailyLessonCard } from "@/components/academy/daily-lesson-card";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { PlantyAvatar } from "@/components/brand/planty";
import { getPlantyMessage } from "@/lib/copy/planty-messages";

export function DashboardEmptyState() {
  const [zipCode, setZipCode] = useState("");
  const [plantyMessage, setPlantyMessage] = useState("");

  useEffect(() => {
    setZipCode(loadUserProfile().zipCode);
    setPlantyMessage(getPlantyMessage());
  }, []);

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-4">
      <PageHeader
        title="Welcome to PlantPal"
        description="Your garden command center"
        action={<FounderModeBadge />}
      />
      <InstallPrompt />

      {/* Rotating Planty welcome + primary actions */}
      <Card padding="lg" className="text-center border-green-100 bg-gradient-to-b from-green-50/80 to-white">
        <PlantyAvatar variant="happy" size={80} className="mx-auto" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700 mt-4">
          Planty says
        </p>
        <h2 className="text-xl font-bold text-gray-900 mt-1">
          {plantyMessage || "Add your first plant. I promise not to judge."}
        </h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Add a plant, scan a problem, or knock out today&apos;s garden task.
        </p>
        <div className="flex flex-col gap-3 mt-6">
          <Link href="/plants/new">
            <Button size="lg" className="w-full touch-manipulation">
              <Plus className="w-4 h-4" />
              Add Your First Plant
            </Button>
          </Link>
          <Link href="/scanner">
            <Button variant="secondary" size="lg" className="w-full touch-manipulation">
              <ScanLine className="w-4 h-4" />
              Scan a Plant
            </Button>
          </Link>
          <Link href="/academy">
            <Button variant="outline" size="lg" className="w-full touch-manipulation">
              <GraduationCap className="w-4 h-4" />
              Take Today&apos;s Lesson
            </Button>
          </Link>
        </div>
      </Card>

      {/* Trending near you — climate-based, clearly not "your plants" */}
      <DashboardTrending zipCode={zipCode} plants={[]} />

      {/* Today's lesson */}
      <DailyLessonCard />

      {/* Invite friends */}
      <Card padding="md" className="text-center">
        <p className="text-2xl mb-1">🌻</p>
        <p className="text-sm font-medium text-gray-900">Grow with friends and family.</p>
        <p className="text-xs text-gray-500 mt-1">
          Share garden wins, swap tips, and keep each other&apos;s plants alive.
        </p>
        <Link href="/invite" className="inline-block mt-3">
          <Button size="sm" variant="secondary" className="touch-manipulation">
            <Users className="w-4 h-4" />
            Invite someone
          </Button>
        </Link>
      </Card>

      {/* Smart suggestions */}
      <DashboardSuggestions />
    </div>
  );
}

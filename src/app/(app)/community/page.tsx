"use client";

import Link from "next/link";
import { Bell, MessageCircleQuestion } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CommunityPreviewBadge } from "@/components/community/community-preview-badge";
import { CommunityHero } from "@/components/community/community-hero";
import { CommunitySection } from "@/components/community/community-section";
import { PlantOfWeekCard } from "@/components/community/plant-of-week-card";
import { CommunityTipsList } from "@/components/community/community-tips-list";
import { CommunityQuestionsList } from "@/components/community/community-questions-list";
import { SuccessStoriesGrid } from "@/components/community/success-stories-grid";
import { CommunityTransformations } from "@/components/community/community-transformations";
import { FeaturedGardensGrid } from "@/components/community/featured-gardens-grid";
import {
  COMMUNITY_STATS,
  PLANT_OF_WEEK,
  LOCAL_GROWER_TIPS,
  COMMUNITY_QUESTIONS,
  SUCCESS_STORIES,
  COMMUNITY_TRANSFORMATIONS,
  FEATURED_GARDENS,
} from "@/lib/mock/community";

export default function CommunityPage() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto page-enter">
      <PageHeader
        title="Community"
        description="Tips, gardens, and stories from growers near you — preview mode."
        action={<CommunityPreviewBadge />}
      />

      <CommunityHero stats={COMMUNITY_STATS} />

      <CommunitySection title="Plant of the Week" subtitle="Curated for your climate and season">
        <PlantOfWeekCard plant={PLANT_OF_WEEK} />
      </CommunitySection>

      <CommunitySection
        title="Featured Gardens"
        subtitle="Six garden styles to inspire your next project"
      >
        <FeaturedGardensGrid gardens={FEATURED_GARDENS} />
      </CommunitySection>

      <CommunitySection
        title="Before & After"
        subtitle="Transformations worth celebrating"
      >
        <CommunityTransformations items={COMMUNITY_TRANSFORMATIONS} />
      </CommunitySection>

      <CommunitySection
        title="Local Grower Tips"
        subtitle={`${COMMUNITY_STATS.tipsThisWeek} shared this week near Pasadena, CA`}
      >
        <CommunityTipsList tips={LOCAL_GROWER_TIPS} />
      </CommunitySection>

      <CommunitySection
        title="Community Questions"
        subtitle={`${COMMUNITY_STATS.questionsThisWeek} questions this week · read-only preview`}
      >
        <CommunityQuestionsList questions={COMMUNITY_QUESTIONS} />
      </CommunitySection>

      <CommunitySection title="Success Stories" subtitle="Real wins from the community">
        <SuccessStoriesGrid stories={SUCCESS_STORIES} />
      </CommunitySection>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-5 py-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
          <MessageCircleQuestion className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-sm font-medium text-gray-900">Want to share your garden?</p>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Posting, reactions, and comments are coming soon. Tables are ready — this page is a
          polished read-only preview until social features launch.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
          <Button variant="secondary" disabled className="touch-manipulation">
            <Bell className="w-4 h-4" />
            Notify me when live
          </Button>
          <Link href="/beta">
            <Button variant="outline" className="w-full sm:w-auto touch-manipulation">
              Join the beta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

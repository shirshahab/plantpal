"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, Leaf, MessageCircleQuestion } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommunityPreviewBadge } from "@/components/community/community-preview-badge";
import { CommunitySection } from "@/components/community/community-section";
import { PlantOfWeekCard } from "@/components/community/plant-of-week-card";
import {
  PLANT_OF_WEEK,
  LOCAL_GROWER_TIPS,
  FEATURED_GARDENS,
  FEATURED_GARDEN_TYPE_LABELS,
} from "@/lib/mock/community";

export default function CommunityPage() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto page-enter">
      <PageHeader
        title="Community"
        description="Garden inspiration and seasonal tips while community features are in beta."
        action={<CommunityPreviewBadge />}
      />

      <CommunitySection title="Plant of the Week" subtitle="Curated for your climate and season">
        <PlantOfWeekCard plant={PLANT_OF_WEEK} />
      </CommunitySection>

      <CommunitySection
        title="Garden Inspiration"
        subtitle="Six garden styles to inspire your next project"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {FEATURED_GARDENS.map((garden) => (
            <Card
              key={garden.id}
              padding="none"
              className="overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="relative h-44 sm:h-52 bg-green-50">
                <Image
                  src={garden.imageUrl}
                  alt={garden.title}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-[10px] font-medium text-white">
                    {FEATURED_GARDEN_TYPE_LABELS[garden.gardenType]}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="text-xs font-medium text-white/75 uppercase tracking-wide">
                    Style guide
                  </p>
                  <h3 className="text-lg font-bold mt-0.5">{garden.title}</h3>
                  <p className="text-sm text-white/85">{garden.subtitle}</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">{garden.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {garden.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CommunitySection>

      <CommunitySection
        title="Seasonal Growing Tips"
        subtitle="From the PlantPal horticulture team"
      >
        <div className="space-y-3">
          {LOCAL_GROWER_TIPS.map((tip) => (
            <Card key={tip.id} padding="md" className="hover:border-green-100 transition-colors">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                  <Leaf className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-relaxed">{tip.tip}</p>
                  <Badge variant="outline" className="text-[10px] mt-2">
                    {tip.tag}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CommunitySection>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-5 py-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
          <MessageCircleQuestion className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-sm font-medium text-gray-900">Want to share your garden?</p>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Posting, questions, and success stories open up as the beta community grows. You&apos;ll
          be among the first 20 growers in.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
          <Link href="/friends">
            <Button variant="secondary" className="w-full sm:w-auto touch-manipulation">
              <Bell className="w-4 h-4" />
              Add friends instead
            </Button>
          </Link>
          <Link href="/invite">
            <Button variant="outline" className="w-full sm:w-auto touch-manipulation">
              Invite a fellow grower
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

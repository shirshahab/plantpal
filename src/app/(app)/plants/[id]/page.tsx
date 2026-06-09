"use client";

import { use, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MessageCircle,
  Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { usePlants } from "@/lib/store/plants-provider";
import { useToast } from "@/lib/store/toast-provider";
import {
  HEALTH_STATUS_LABELS,
  LOCATION_TYPE_LABELS,
  PLANTING_TYPE_LABELS,
  SUN_EXPOSURE_LABELS,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { PlantLessonsSection } from "@/components/education/plant-lessons-section";
import { GrowthTimeline } from "@/components/growth/growth-timeline";
import { PhotoHistory } from "@/components/photos/photo-history";
import { HarvestTracker } from "@/components/harvest/harvest-tracker";
import { HealthScoreBadge, HealthScoreRing } from "@/components/score/health-score-badge";
import { calculatePlantHealthScore } from "@/lib/scoring";
import { isEdiblePlant } from "@/lib/mock/harvest";
import { useEngagement } from "@/lib/store/engagement-provider";
import { PlantJourneySection } from "@/components/journey/plant-journey-section";
import { GoalAwareCareSchedule } from "@/components/journey/goal-aware-care-schedule";
import { GenerateCarePlanButton } from "@/components/ai/ai-plant-actions";
import { LocalCareCard } from "@/components/climate/local-care-card";
import { useJourney } from "@/lib/store/journey-provider";
import { PlantGenomeSection } from "@/components/genome/plant-genome-section";
import { FirstPlantSuccess } from "@/components/plants/first-plant-success";

const healthVariant = {
  healthy: "success" as const,
  needs_attention: "warning" as const,
  critical: "danger" as const,
};

export default function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState fullPage message="Loading plant..." />}>
      <PlantDetailContent params={params} />
    </Suspense>
  );
}

function PlantDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const showWelcome = searchParams.get("welcome") === "1";
  const { getPlant, markWatered, loading } = usePlants();
  const { toast } = useToast();
  const { recordWatering } = useEngagement();
  const { getPrimaryGoal } = useJourney();
  const plant = getPlant(id);
  const healthScore = plant ? calculatePlantHealthScore(plant) : 0;
  const primaryGoal = plant ? getPrimaryGoal(plant.id) : null;

  async function handleMarkWatered() {
    if (!plant) return;
    await markWatered(plant.id);
    recordWatering();
    toast("Watering logged.");
  }

  if (loading) {
    return <LoadingState fullPage message="Loading plant..." />;
  }

  if (!plant) {
    return (
      <EmptyState
        icon="🔍"
        title="Plant not found"
        description="This plant doesn't exist or may have been removed."
        actionLabel="Back to Garden"
        actionHref="/plants"
      />
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/plants"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to garden
      </Link>

      {showWelcome && <FirstPlantSuccess plantId={plant.id} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="relative h-64 sm:h-80 bg-green-50">
              <Image
                src={plant.image}
                alt={plant.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            </div>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {plant.name}
                  </h1>
                  <p className="text-gray-500 italic mt-0.5">{plant.species}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <HealthScoreRing score={healthScore} size={44} />
                    <HealthScoreBadge score={healthScore} size="md" />
                  </div>
                  <Badge variant={healthVariant[plant.healthStatus]}>
                    {HEALTH_STATUS_LABELS[plant.healthStatus]}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {[
                  { label: "Location", value: LOCATION_TYPE_LABELS[plant.locationType] },
                  { label: "Planting", value: PLANTING_TYPE_LABELS[plant.plantingType] },
                  { label: "Sun", value: SUN_EXPOSURE_LABELS[plant.sunExposure] },
                  { label: "ZIP", value: plant.zipCode },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                Added {formatDate(plant.createdAt)}
              </div>
            </CardContent>
          </Card>

          <LocalCareCard plants={[plant]} plant={plant} />

          <PlantGenomeSection plant={plant} />

          <PlantJourneySection plant={plant} />

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                Care Schedule
              </h2>
            </CardHeader>
            <CardContent>
              <GoalAwareCareSchedule
                plant={plant}
                onMarkWatered={handleMarkWatered}
              />
            </CardContent>
          </Card>

          <Card padding="md" className="hidden md:block">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Health Notes
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {plant.healthNotes}
            </p>
          </Card>

          <div className="hidden md:block space-y-6">
            <PlantLessonsSection plant={plant} />
            <GrowthTimeline plant={plant} />
            <PhotoHistory plantId={plant.id} />
            {isEdiblePlant(plant.species, plant.name) && (
              <HarvestTracker plant={plant} />
            )}
          </div>
        </div>

        <div className="order-first lg:order-none">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  AI Plant Coach
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 px-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
                  <Sun className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  PlantPal will answer based on your plant type, ZIP code, health
                  status, and selected goals
                  {primaryGoal ? ` (like "${primaryGoal.name}")` : ""}.
                </p>
                <GenerateCarePlanButton plant={plant} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

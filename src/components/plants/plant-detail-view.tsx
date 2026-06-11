"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Droplets,
  ScanLine,
  Camera,
  Sparkles,
  Pencil,
  Clock,
  ListTodo,
  StickyNote,
  Trash2,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlantImage } from "@/components/plants/plant-image";
import { RemovePlantModal } from "@/components/plants/remove-plant-modal";
import { SendFeedbackButton } from "@/components/feedback/send-feedback-button";
import { GenerateCarePlanButton } from "@/components/ai/ai-plant-actions";
import { Planty } from "@/components/brand/planty";
import { RequestExpertReview } from "@/components/health/request-expert-review";
import { GoalAwareCareSchedule } from "@/components/journey/goal-aware-care-schedule";
import { LocalCareCard } from "@/components/climate/local-care-card";
import { GrowthTimeline } from "@/components/growth/growth-timeline";
import { PhotoHistory } from "@/components/photos/photo-history";
import { PlantJournalTab } from "@/components/social/plant-journal-tab";
import { FirstPlantSuccess } from "@/components/plants/first-plant-success";
import { HealthScoreBadge, HealthScoreRing } from "@/components/score/health-score-badge";
import { usePlants } from "@/lib/store/plants-provider";
import { useToast } from "@/lib/store/toast-provider";
import { friendlySaveError } from "@/lib/errors/user-messages";
import { useEngagement } from "@/lib/store/engagement-provider";
import { useJourney } from "@/lib/store/journey-provider";
import {
  HEALTH_STATUS_LABELS,
  LOCATION_TYPE_LABELS,
  type Plant,
} from "@/lib/types";
import { formatPlantSize } from "@/lib/plants/plant-size";
import { getPlantyFact } from "@/lib/care/planty-facts";
import { calculatePlantHealthScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";

type DetailTab = "care" | "timeline" | "journal" | "tasks" | "notes";

const healthVariant = {
  healthy: "success" as const,
  needs_attention: "warning" as const,
  critical: "danger" as const,
};

interface PlantDetailViewProps {
  plant: Plant;
  showWelcome?: boolean;
}

export function PlantDetailView({ plant, showWelcome }: PlantDetailViewProps) {
  const { markWatered, removePlant } = usePlants();
  const { toast } = useToast();
  const { recordWatering } = useEngagement();
  const { getPrimaryGoal, getPlantGoals } = useJourney();
  const [tab, setTab] = useState<DetailTab>("care");
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [waterLoading, setWaterLoading] = useState(false);

  const healthScore = calculatePlantHealthScore(plant);
  const primaryGoal = getPrimaryGoal(plant.id);
  const sizeLabel = formatPlantSize(plant);
  const plantyFact = getPlantyFact({
    species: plant.species,
    commonName: plant.name,
    goals: getPlantGoals(plant.id).map((g) => g.id),
    location: plant.zipCode,
    plantId: plant.id,
  });

  async function handleMarkWatered() {
    setWaterLoading(true);
    try {
      await markWatered(plant.id);
      recordWatering();
      toast("Watering logged.");
    } catch (e) {
      toast(friendlySaveError(e instanceof Error ? e.message : "Could not log watering."));
    } finally {
      setWaterLoading(false);
    }
  }

  async function handleRemove() {
    setRemoveLoading(true);
    try {
      await removePlant(plant.id);
      toast("Plant removed.");
      window.location.href = "/plants";
    } catch (e) {
      toast(friendlySaveError(e instanceof Error ? e.message : "Could not remove plant."));
      setRemoveLoading(false);
    }
  }

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: "care", label: "Care", icon: Sparkles },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "journal", label: "Journal", icon: BookOpen },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "notes", label: "Notes", icon: StickyNote },
  ];

  return (
    <div className="space-y-5 pb-4 max-w-3xl mx-auto">
      <Link
        href="/plants"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors touch-manipulation"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to garden
      </Link>

      <div className="flex justify-end -mt-2 mb-1">
        <SendFeedbackButton />
      </div>

      {showWelcome && <FirstPlantSuccess plantId={plant.id} />}

      {plant.photoStatus === "needs_photo" && (
        <Card padding="md" className="border-amber-100 bg-amber-50/80">
          <p className="text-sm text-amber-800 font-medium">
            No photo yet. Add one when you&apos;re near this plant.
          </p>
          <Link href={`/plants/${plant.id}/edit`} className="inline-block mt-2">
            <Button variant="secondary" size="sm" className="touch-manipulation">
              <Camera className="w-4 h-4" />
              Add photo
            </Button>
          </Link>
        </Card>
      )}

      <Card className="overflow-hidden">
        <PlantImage
          plant={plant}
          className="h-52 sm:h-64 w-full"
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          showBadge
        />
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{plant.name}</h1>
              <p className="text-gray-500 italic text-sm mt-0.5 truncate">{plant.species}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <HealthScoreRing score={healthScore} size={40} />
                <HealthScoreBadge score={healthScore} size="sm" />
              </div>
              <Badge variant={healthVariant[plant.healthStatus]} className="text-[10px]">
                {HEALTH_STATUS_LABELS[plant.healthStatus]}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            {sizeLabel && (
              <span className="inline-flex items-center rounded-full bg-green-50 text-green-800 px-3 py-1 font-medium">
                {sizeLabel}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1">
              {LOCATION_TYPE_LABELS[plant.locationType]}
            </span>
            {primaryGoal && (
              <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-800 px-3 py-1">
                {primaryGoal.icon} {primaryGoal.name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Button
          size="lg"
          className="h-14 touch-manipulation col-span-2 sm:col-span-1"
          loading={waterLoading}
          onClick={() => void handleMarkWatered()}
        >
          <Droplets className="w-5 h-5" />
          Water
        </Button>
        <Link href="/scanner" className="contents">
          <Button variant="secondary" size="lg" className="h-14 touch-manipulation w-full">
            <ScanLine className="w-5 h-5" />
            Scan
          </Button>
        </Link>
        <Link href={`/plants/${plant.id}/edit`} className="contents">
          <Button variant="outline" size="lg" className="h-14 touch-manipulation w-full">
            <Camera className="w-5 h-5" />
            Add Photo
          </Button>
        </Link>
        <Button
          variant="outline"
          size="lg"
          className="h-14 touch-manipulation"
          onClick={() => {
            setTab("care");
            document.getElementById("ai-coach")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <Sparkles className="w-5 h-5" />
          Care Plan
        </Button>
        <Link href={`/plants/${plant.id}/edit`} className="contents">
          <Button variant="outline" size="lg" className="h-14 touch-manipulation w-full">
            <Pencil className="w-5 h-5" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
        {tabs.slice(1).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium touch-manipulation transition-colors",
              tab === id
                ? "bg-green-100 text-green-800"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRemoveOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 touch-manipulation ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-lg touch-manipulation transition-colors",
              tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "care" && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Care schedule</h2>
            </CardHeader>
            <CardContent>
              <GoalAwareCareSchedule plant={plant} onMarkWatered={handleMarkWatered} />
            </CardContent>
          </Card>
          <LocalCareCard plants={[plant]} plant={plant} />
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">PlantPal Care Plan</h2>
              <Planty variant="thinking" subtle message={plantyFact} className="mt-2" />
            </CardHeader>
            <CardContent>
              <GenerateCarePlanButton plant={plant} />
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "timeline" && (
        <div className="space-y-5">
          <GrowthTimeline plant={plant} />
          <PhotoHistory plantId={plant.id} />
        </div>
      )}

      {tab === "journal" && <PlantJournalTab plantId={plant.id} plantName={plant.name} />}

      {tab === "tasks" && (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-sm text-gray-600">
              See watering, fertilizing, and seasonal tasks for all your plants.
            </p>
            <Link href="/today">
              <Button className="touch-manipulation">View today&apos;s tasks</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {tab === "notes" && (
        <>
          <Card padding="md">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Health notes</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {plant.healthNotes || "No notes yet. Edit your plant to add observations."}
            </p>
            <Link href={`/plants/${plant.id}/edit`} className="inline-block mt-4">
              <Button variant="outline" size="sm" className="touch-manipulation">
                <Pencil className="w-4 h-4" />
                Edit notes
              </Button>
            </Link>
          </Card>
          <RequestExpertReview
            plantId={plant.id}
            cropType={plant.species}
            defaultDescription={plant.healthNotes ?? ""}
          />
        </>
      )}

      <RemovePlantModal
        open={removeOpen}
        plantName={plant.name}
        loading={removeLoading}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => void handleRemove()}
      />
    </div>
  );
}

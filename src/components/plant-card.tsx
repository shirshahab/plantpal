import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, Sun } from "lucide-react";
import type { Plant } from "@/lib/types";
import {
  HEALTH_STATUS_LABELS,
  LOCATION_TYPE_LABELS,
  SUN_EXPOSURE_LABELS,
} from "@/lib/types";
import { needsWaterToday } from "@/lib/plant-utils";
import { calculatePlantHealthScore } from "@/lib/scoring";
import { HealthScoreBadge } from "@/components/score/health-score-badge";
import { PlantImage } from "@/components/plants/plant-image";
import { PlantActionsMenu } from "@/components/plants/plant-actions-menu";
import { formatPlantSize } from "@/lib/plants/plant-size";

interface PlantCardProps {
  plant: Plant;
}

const healthVariant = {
  healthy: "success" as const,
  needs_attention: "warning" as const,
  critical: "danger" as const,
};

export function PlantCard({ plant }: PlantCardProps) {
  const dueWater = needsWaterToday(plant);
  const score = calculatePlantHealthScore(plant);
  const sizeLabel = formatPlantSize(plant);

  return (
    <div className="relative h-full">
      <Link href={`/plants/${plant.id}`} className="block h-full">
        <Card hover className="overflow-hidden h-full group">
          <div className="relative h-44">
            <PlantImage
              plant={plant}
              className="h-full w-full"
              sizes="(max-width: 768px) 100vw, 33vw"
              showBadge
            />
            <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap pointer-events-none">
              <HealthScoreBadge score={score} size="sm" showLabel={false} />
              <Badge variant={healthVariant[plant.healthStatus]}>
                {HEALTH_STATUS_LABELS[plant.healthStatus]}
              </Badge>
            </div>
            {dueWater && (
              <div className="absolute top-3 right-12 pointer-events-none">
                <Badge variant="info">Water today</Badge>
              </div>
            )}
          </div>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900">{plant.name}</h3>
              <p className="text-sm text-gray-500 italic">{plant.species}</p>
              {sizeLabel && (
                <p className="text-xs text-green-600 font-medium mt-1">{sizeLabel}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Sun className="w-3 h-3" />
                {SUN_EXPOSURE_LABELS[plant.sunExposure]}
              </span>
              <span>·</span>
              <span>{LOCATION_TYPE_LABELS[plant.locationType]}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg w-fit">
              <Droplets className="w-3 h-3" />
              Every {plant.waterFrequencyDays} days
            </div>
          </CardContent>
        </Card>
      </Link>
      <PlantActionsMenu plantId={plant.id} plantName={plant.name} variant="card" />
    </div>
  );
}

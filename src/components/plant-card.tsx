import Link from "next/link";
import Image from "next/image";
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

  return (
    <Link href={`/plants/${plant.id}`}>
      <Card hover className="overflow-hidden h-full group">
        <div className="relative h-44 bg-green-50">
          <Image
            src={plant.image}
            alt={plant.name}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <HealthScoreBadge score={score} size="sm" showLabel={false} />
            <Badge variant={healthVariant[plant.healthStatus]}>
              {HEALTH_STATUS_LABELS[plant.healthStatus]}
            </Badge>
          </div>
          {dueWater && (
            <div className="absolute top-3 right-3">
              <Badge variant="info">Water today</Badge>
            </div>
          )}
        </div>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900">{plant.name}</h3>
            <p className="text-sm text-gray-500 italic">{plant.species}</p>
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
  );
}

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/plants/plant-image";
import type { PlantSpecies } from "@/lib/knowledge/types";
import { PLANT_TYPE_LABELS } from "@/lib/knowledge/types";

interface PlantSpeciesCardProps {
  species: PlantSpecies;
}

export function PlantSpeciesCard({ species }: PlantSpeciesCardProps) {
  return (
    <Link href={`/database/plants/${species.id}`}>
      <Card
        padding="none"
        className="overflow-hidden hover:shadow-md transition-shadow group h-full"
      >
        <div className="relative h-36 bg-green-50">
          <SafeImage
            src={species.image_url}
            alt={species.common_name}
            plantText={`${species.common_name} ${species.scientific_name} ${species.type}`}
            className="group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {species.common_name}
              </h3>
              <p className="text-xs text-gray-500 italic truncate mt-0.5">
                {species.scientific_name}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1 group-hover:text-green-600" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge variant="default">{PLANT_TYPE_LABELS[species.type]}</Badge>
            <Badge variant="outline" className="text-[10px]">
              Zone {species.hardiness_zone_min}–{species.hardiness_zone_max}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}

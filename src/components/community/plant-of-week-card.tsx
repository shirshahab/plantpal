import Image from "next/image";
import Link from "next/link";
import { Sparkles, Heart, Leaf } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlantOfWeek } from "@/lib/mock/community";

export function PlantOfWeekCard({ plant }: { plant: PlantOfWeek }) {
  return (
    <Card padding="none" className="overflow-hidden border-green-100">
      <div className="relative h-48 sm:h-56 bg-green-50">
        <Image
          src={plant.imageUrl}
          alt={plant.commonName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 896px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge className="bg-white/95 text-green-800 border-0 shadow-sm">
            <Sparkles className="w-3 h-3" />
            Plant of the week
          </Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
          <p className="text-xs font-medium text-white/80 uppercase tracking-wide">
            {plant.updatedLabel}
          </p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1">{plant.commonName}</h3>
          <p className="text-sm text-white/85 italic">{plant.scientificName}</p>
        </div>
      </div>
      <div className="p-4 sm:p-5 space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">{plant.blurb}</p>
        <Card padding="md" className="bg-amber-50/80 border-amber-100">
          <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-1">
            Why now
          </p>
          <p className="text-sm text-amber-900/90">{plant.whyNow}</p>
        </Card>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Badge variant="outline">{plant.zone}</Badge>
            <span className="inline-flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-400" />
              {plant.cheers} cheers
            </span>
          </div>
          <Link
            href="/database/plants/species-meyer-lemon-tree"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 touch-manipulation"
          >
            <Leaf className="w-4 h-4" />
            View in database
          </Link>
        </div>
      </div>
    </Card>
  );
}

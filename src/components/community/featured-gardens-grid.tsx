import Image from "next/image";
import { Heart, MapPin, Leaf } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FeaturedGarden } from "@/lib/mock/community";
import { FEATURED_GARDEN_TYPE_LABELS } from "@/lib/mock/community";

function OwnerAvatar({ label }: { label: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-white/90 text-green-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm">
      {label}
    </div>
  );
}

export function FeaturedGardensGrid({ gardens }: { gardens: FeaturedGarden[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {gardens.map((garden) => (
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
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-xs font-medium text-gray-700 shadow-sm">
                <Heart className="w-3 h-3 text-red-400" />
                {garden.cheers}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <p className="text-xs font-medium text-white/75 uppercase tracking-wide">
                Featured garden
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
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <OwnerAvatar label={garden.ownerAvatar} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {garden.owner}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {garden.location}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-gray-400 shrink-0">
                <Leaf className="w-3 h-3" />
                {garden.plantCount} plants
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

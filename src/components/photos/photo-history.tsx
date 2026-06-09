"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Images } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PhotoType } from "@/lib/types/ai";
import { usePhotos, type PhotoFilter } from "@/lib/store/photos-provider";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

const FILTERS: { id: PhotoFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "growth", label: "Growth" },
  { id: "health_scan", label: "Health" },
  { id: "nursery_tag", label: "Tags" },
  { id: "profile", label: "Profile" },
  { id: "identification", label: "ID" },
];

const TYPE_LABELS: Record<PhotoType, string> = {
  profile: "Profile",
  health_scan: "Health",
  growth: "Growth",
  nursery_tag: "Tag",
  identification: "ID",
};

export function PhotoHistory({ plantId }: { plantId: string }) {
  const { getPhotosForPlant, ready } = usePhotos();
  const [filter, setFilter] = useState<PhotoFilter>("all");

  const photos = useMemo(
    () => getPhotosForPlant(plantId, filter),
    [getPhotosForPlant, plantId, filter]
  );

  if (!ready) return null;

  return (
    <Card id="photos">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Images className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Photo History</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium touch-manipulation transition-colors",
                filter === f.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {photos.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No photos yet. Use the camera to add progress or health scans.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="space-y-1.5">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={photo.photoUrl}
                    alt={photo.notes || "Plant photo"}
                    fill
                    className="object-cover"
                    sizes="160px"
                    unoptimized={photo.photoUrl.startsWith("data:")}
                  />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/50 text-white text-[10px] font-medium">
                    {TYPE_LABELS[photo.photoType]}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">{formatDate(photo.createdAt)}</p>
                {photo.notes && (
                  <p className="text-xs text-gray-600 line-clamp-2">{photo.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

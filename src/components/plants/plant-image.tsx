"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Plant } from "@/lib/types";
import type { PlaceholderImageType } from "@/lib/plants/plant-size";
import {
  getPlaceholderImageUrl,
  getPlaceholderStyle,
  isPlaceholderImageUrl,
  resolvePlantImageUrl,
} from "@/lib/plants/plant-placeholders";
import { Badge } from "@/components/ui/badge";

interface PlantImageProps {
  plant: Pick<
    Plant,
    "image" | "photoStatus" | "placeholderImageType" | "name"
  >;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  showBadge?: boolean;
}

export function PlantImage({
  plant,
  className,
  fill = true,
  priority,
  sizes,
  showBadge = false,
}: PlantImageProps) {
  const src = resolvePlantImageUrl(plant);
  const isPlaceholder =
    plant.photoStatus === "placeholder" ||
    isPlaceholderImageUrl(src) ||
    (plant.photoStatus !== "real_photo" && plant.placeholderImageType);

  if (isPlaceholder && plant.placeholderImageType) {
    const style = getPlaceholderStyle(plant.placeholderImageType);
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center overflow-hidden",
          className
        )}
        style={{ background: style.gradient }}
      >
        <span className="text-5xl sm:text-6xl drop-shadow-sm">{style.emoji}</span>
        <span className="text-xs font-semibold text-white/90 mt-2 uppercase tracking-wide">
          {style.label}
        </span>
        {showBadge && plant.photoStatus === "needs_photo" && (
          <NeedsPhotoBadge className="absolute top-3 left-3" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-green-50", className)}>
      <Image
        src={src}
        alt={plant.name}
        fill={fill}
        className="object-cover"
        priority={priority}
        sizes={sizes}
        unoptimized={src.startsWith("data:")}
      />
      {showBadge && plant.photoStatus === "needs_photo" && (
        <NeedsPhotoBadge className="absolute top-3 left-3" />
      )}
    </div>
  );
}

export function PlaceholderPickerCard({
  type,
  selected,
  onSelect,
}: {
  type: PlaceholderImageType;
  selected: boolean;
  onSelect: () => void;
}) {
  const style = getPlaceholderStyle(type);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-xl overflow-hidden border-2 transition-all text-left touch-manipulation",
        selected ? "border-green-600 ring-2 ring-green-200" : "border-gray-200"
      )}
    >
      <div
        className="h-20 flex flex-col items-center justify-center"
        style={{ background: style.gradient }}
      >
        <span className="text-2xl">{style.emoji}</span>
      </div>
      <p className="text-[10px] font-medium text-gray-700 px-2 py-1.5 text-center">
        {style.label}
      </p>
    </button>
  );
}

export function NeedsPhotoBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" className={cn("text-[10px]", className)}>
      Needs photo
    </Badge>
  );
}

export function getPreviewImageUrl(
  preview: string | null,
  placeholderType: PlaceholderImageType | null,
  speciesImage: string | null
): string | null {
  if (preview) return preview;
  if (placeholderType) return getPlaceholderImageUrl(placeholderType);
  return speciesImage;
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Plant } from "@/lib/types";
import type { PlaceholderImageType } from "@/lib/plants/plant-size";
import {
  getPlantDisplayImage,
  getArtworkForText,
  GENERIC_PLANT_ARTWORK,
} from "@/lib/plants/plant-artwork";
import {
  getPlaceholderImageUrl,
  getPlaceholderLabel,
} from "@/lib/plants/plant-placeholders";
import { Badge } from "@/components/ui/badge";

/** Hosts configured in next.config.ts — anything else must skip optimization,
 * otherwise next/image throws instead of firing onError. */
function skipOptimization(src: string): boolean {
  if (src.startsWith("/")) return false;
  if (src.startsWith("data:") || src.startsWith("blob:")) return true;
  try {
    const host = new URL(src).hostname;
    return !(
      host === "images.unsplash.com" ||
      host.endsWith(".supabase.co") ||
      host === "perenual.com" ||
      host.endsWith(".perenual.com")
    );
  } catch {
    return true;
  }
}

interface PlantImageProps {
  plant: Pick<
    Plant,
    "image" | "photoStatus" | "placeholderImageType" | "name" | "species"
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
  const display = getPlantDisplayImage(plant);
  const [src, setSrc] = useState(display.src);

  // Re-sync when the plant's photo changes (e.g. after upload).
  useEffect(() => {
    setSrc(display.src);
  }, [display.src]);

  const handleError = () => {
    // Fall through the guaranteed-local chain so the box is never blank.
    if (src !== display.fallbackSrc) setSrc(display.fallbackSrc);
    else if (src !== GENERIC_PLANT_ARTWORK) setSrc(GENERIC_PLANT_ARTWORK);
  };

  return (
    <div className={cn("relative overflow-hidden bg-[#eef4e3]", className)}>
      <Image
        src={src}
        alt={plant.name}
        fill={fill}
        className="object-cover"
        priority={priority}
        sizes={sizes}
        unoptimized={skipOptimization(src)}
        onError={handleError}
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
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-xl overflow-hidden border-2 transition-all text-left touch-manipulation bg-white",
        selected ? "border-green-600 ring-2 ring-green-200" : "border-gray-200"
      )}
    >
      <div className="relative h-20 bg-[#eef4e3]">
        <Image
          src={getPlaceholderImageUrl(type)}
          alt={getPlaceholderLabel(type)}
          fill
          className="object-cover"
          sizes="120px"
        />
      </div>
      <p className="text-[10px] font-medium text-gray-700 px-2 py-1.5 text-center">
        {getPlaceholderLabel(type)}
      </p>
    </button>
  );
}

/**
 * next/image with a guaranteed-local artwork fallback — never renders a
 * broken/blank image box. Pass plant text (name/species) to pick the artwork.
 */
export function SafeImage({
  src,
  alt,
  plantText,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  plantText: string;
  sizes?: string;
  className?: string;
}) {
  const [current, setCurrent] = useState(src);
  useEffect(() => setCurrent(src), [src]);

  const handleError = () => {
    const artwork = getArtworkForText(plantText);
    if (current !== artwork) setCurrent(artwork);
    else if (current !== GENERIC_PLANT_ARTWORK) setCurrent(GENERIC_PLANT_ARTWORK);
  };

  return (
    <Image
      src={current}
      alt={alt}
      fill
      className={cn("object-cover", className)}
      sizes={sizes}
      unoptimized={skipOptimization(current)}
      onError={handleError}
    />
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

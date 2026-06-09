"use client";

import { cn } from "@/lib/utils";
import type { SpaceType } from "@/lib/landscape/types";
import { SPACE_TYPE_ICONS, SPACE_TYPE_LABELS } from "@/lib/landscape/types";

const SPACE_TYPES: SpaceType[] = [
  "front_yard",
  "back_yard",
  "side_yard",
  "patio",
  "balcony",
  "slope",
];

interface SpaceTypePickerProps {
  value: SpaceType | null;
  onChange: (space: SpaceType) => void;
}

export function SpaceTypePicker({ value, onChange }: SpaceTypePickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {SPACE_TYPES.map((space) => {
        const selected = value === space;
        return (
          <button
            key={space}
            type="button"
            onClick={() => onChange(space)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all touch-manipulation",
              selected
                ? "border-green-500 bg-green-50 ring-2 ring-green-500/20"
                : "border-gray-100 bg-white hover:border-green-200 hover:bg-green-50/30"
            )}
          >
            <span className="text-2xl" aria-hidden>
              {SPACE_TYPE_ICONS[space]}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                selected ? "text-green-800" : "text-gray-700"
              )}
            >
              {SPACE_TYPE_LABELS[space]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import type { StyleGoal } from "@/lib/landscape/types";
import { GARDEN_STYLES } from "@/lib/landscape/garden-styles";

interface StyleGoalPickerProps {
  value: StyleGoal | null;
  onChange: (goal: StyleGoal) => void;
}

export function StyleGoalPicker({ value, onChange }: StyleGoalPickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {GARDEN_STYLES.map((style) => {
        const selected = value === style.id;
        return (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            className={cn(
              "flex flex-col items-start p-4 rounded-2xl border text-left transition-all touch-manipulation min-h-[120px]",
              selected
                ? "border-green-500 bg-green-50 ring-2 ring-green-500/20"
                : "border-gray-100 bg-white hover:border-green-200 hover:bg-green-50/30"
            )}
          >
            <span className="text-2xl mb-2" aria-hidden>
              {style.icon}
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                selected ? "text-green-800" : "text-gray-900"
              )}
            >
              {style.label}
            </span>
            <span className="text-xs text-gray-500 mt-1 leading-snug">
              {style.description}
            </span>
            <span className="text-[10px] text-gray-400 mt-2">{style.costRange}</span>
          </button>
        );
      })}
    </div>
  );
}

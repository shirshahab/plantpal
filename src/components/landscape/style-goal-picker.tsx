"use client";

import { cn } from "@/lib/utils";
import type { StyleGoal } from "@/lib/landscape/types";
import { STYLE_GOAL_ICONS, STYLE_GOAL_LABELS } from "@/lib/landscape/types";

const STYLE_GOALS: StyleGoal[] = [
  "fruit_garden",
  "low_maintenance",
  "native_garden",
  "tropical",
  "mediterranean",
  "japanese_garden",
  "kids_family",
  "pollinator",
  "privacy",
  "outdoor_living",
];

interface StyleGoalPickerProps {
  value: StyleGoal | null;
  onChange: (goal: StyleGoal) => void;
}

export function StyleGoalPicker({ value, onChange }: StyleGoalPickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {STYLE_GOALS.map((goal) => {
        const selected = value === goal;
        return (
          <button
            key={goal}
            type="button"
            onClick={() => onChange(goal)}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl border text-left transition-all touch-manipulation",
              selected
                ? "border-green-500 bg-green-50 ring-2 ring-green-500/20"
                : "border-gray-100 bg-white hover:border-green-200 hover:bg-green-50/30"
            )}
          >
            <span className="text-lg shrink-0" aria-hidden>
              {STYLE_GOAL_ICONS[goal]}
            </span>
            <span
              className={cn(
                "text-xs font-medium leading-tight",
                selected ? "text-green-800" : "text-gray-700"
              )}
            >
              {STYLE_GOAL_LABELS[goal]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

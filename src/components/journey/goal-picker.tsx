"use client";

import type { GoalCategory } from "@/lib/types/care-goals";
import { GOAL_CATEGORY_LABELS } from "@/lib/types/care-goals";
import { PLANT_GOAL_CATALOG } from "@/lib/mock/plant-goals";
import { cn } from "@/lib/utils";

interface GoalPickerProps {
  selectedIds: string[];
  primaryId: string | null;
  onChange: (ids: string[], primaryId: string | null) => void;
  compact?: boolean;
}

const CATEGORY_ORDER: GoalCategory[] = [
  "general",
  "pruning",
  "fruit_trees",
  "flowering",
  "landscape",
  "bonsai",
  "indoor",
];

export function GoalPicker({
  selectedIds,
  primaryId,
  onChange,
  compact = false,
}: GoalPickerProps) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter((x) => x !== id);
      const nextPrimary =
        primaryId === id ? (next[0] ?? null) : primaryId;
      onChange(next, nextPrimary);
    } else {
      const next = [...selectedIds, id];
      onChange(next, primaryId ?? id);
    }
  }

  function setPrimary(id: string) {
    if (!selectedIds.includes(id)) {
      onChange([...selectedIds, id], id);
    } else {
      onChange(selectedIds, id);
    }
  }

  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.map((category) => {
        const goals = PLANT_GOAL_CATALOG.filter((g) => g.category === category);
        return (
          <div key={category}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              {GOAL_CATEGORY_LABELS[category]}
            </h3>
            <div className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
              {goals.map((goal) => {
                const selected = selectedIds.includes(goal.id);
                const isPrimary = primaryId === goal.id;
                return (
                  <div key={goal.id} className="relative">
                    <button
                      type="button"
                      onClick={() => toggle(goal.id)}
                      className={cn(
                        "w-full text-left rounded-2xl border-2 p-3 transition-all touch-manipulation",
                        selected
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg" aria-hidden>
                          {goal.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {goal.name}
                            {isPrimary && (
                              <span className="ml-1.5 text-xs font-normal text-green-700">
                                · Your main goal
                              </span>
                            )}
                          </p>
                          {!compact && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                    {selected && !isPrimary && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimary(goal.id);
                        }}
                        className="absolute top-2 right-2 text-[10px] font-medium text-green-700 bg-white/90 px-2 py-0.5 rounded-full border border-green-200"
                      >
                        Set as main
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {selectedIds.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
          Pick at least one goal. This shapes your care plan.
        </p>
      )}
    </div>
  );
}

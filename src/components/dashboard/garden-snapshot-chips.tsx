"use client";

import { cn } from "@/lib/utils";
import type { GardenChip } from "@/lib/garden/garden-snapshot";

export function GardenSnapshotChips({
  chips,
  className,
}: {
  chips: GardenChip[];
  className?: string;
}) {
  if (chips.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 max-w-full",
        className
      )}
    >
      {chips.map((chip) => (
        <span
          key={`${chip.type}-${chip.label}`}
          className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-100/80 px-2.5 py-1 text-xs font-medium text-green-900 whitespace-nowrap shrink-0"
        >
          <span aria-hidden>{chip.emoji}</span>
          {chip.count != null && chip.type !== "xp" && chip.type !== "streak" ? (
            <span>
              {chip.label} {chip.count}
            </span>
          ) : (
            <span>{chip.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

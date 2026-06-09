"use client";

import { cn } from "@/lib/utils";
import { useSubscription } from "@/lib/store/subscription-provider";

interface FounderModeBadgeProps {
  className?: string;
}

export function FounderModeBadge({ className }: FounderModeBadgeProps) {
  const { founderMode } = useSubscription();

  if (!founderMode) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 border border-green-200/80",
        className
      )}
      title="Founder Mode Active"
    >
      <span aria-hidden>🌿</span>
      Founder
    </span>
  );
}

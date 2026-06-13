"use client";

import { isDevEnvironment } from "@/lib/dev/dev-tools";
import { useSubscription } from "@/lib/store/subscription-provider";
import { cn } from "@/lib/utils";

interface FounderModeBadgeProps {
  className?: string;
}

/** Internal dev badge only. Hidden in production builds. */
export function FounderModeBadge({ className }: FounderModeBadgeProps) {
  const { founderMode } = useSubscription();

  if (!isDevEnvironment() || !founderMode) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700",
        className
      )}
    >
      Dev
    </span>
  );
}

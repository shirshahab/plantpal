"use client";

import { cn } from "@/lib/utils";

interface AiSafetyDisclaimerProps {
  className?: string;
  compact?: boolean;
}

export function AiSafetyDisclaimer({ className, compact }: AiSafetyDisclaimerProps) {
  return (
    <p
      className={cn(
        "text-amber-800/90 leading-relaxed",
        compact ? "text-[11px] px-1" : "text-xs bg-amber-50/80 border border-amber-100 rounded-lg px-3 py-2",
        className
      )}
      role="note"
    >
      PlantPal can make mistakes. Use this as guidance, not certainty.
    </p>
  );
}

"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BetaAccessBannerProps {
  className?: string;
  compact?: boolean;
}

export function BetaAccessBanner({ className, compact }: BetaAccessBannerProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-amber-200 bg-amber-50/80 text-amber-900",
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
        className
      )}
    >
      <p className={cn("font-medium flex items-center gap-2", compact && "text-xs")}>
        <Sparkles className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
        Beta Access Enabled
      </p>
      {!compact && (
        <p className="text-amber-800/90 mt-1 leading-relaxed">
          All Plus and Family features are unlocked for testing. Upgrade prompts are hidden.
        </p>
      )}
    </div>
  );
}

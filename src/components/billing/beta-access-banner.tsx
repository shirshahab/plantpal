"use client";

import { Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/lib/store/subscription-provider";

interface BetaAccessBannerProps {
  className?: string;
  compact?: boolean;
}

export function BetaAccessBanner({ className, compact }: BetaAccessBannerProps) {
  const { founderMode } = useSubscription();

  const title = founderMode ? "Founder Mode Active" : "Beta Access Enabled";
  const Icon = founderMode ? Crown : Sparkles;
  const description = founderMode
    ? "All Plus and Pro features are unlocked. Upgrade prompts and paywalls are hidden."
    : "All Plus and Family features are unlocked for testing. Upgrade prompts are hidden.";

  return (
    <div
      className={cn(
        "rounded-xl border text-amber-900",
        founderMode
          ? "border-green-200 bg-green-50/80 text-green-900"
          : "border-amber-200 bg-amber-50/80",
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
        className
      )}
    >
      <p className={cn("font-medium flex items-center gap-2", compact && "text-xs")}>
        <Icon className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
        {title}
      </p>
      {!compact && (
        <p
          className={cn(
            "mt-1 leading-relaxed",
            founderMode ? "text-green-800/90" : "text-amber-800/90"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

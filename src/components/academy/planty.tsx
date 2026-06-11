"use client";

import { cn } from "@/lib/utils";
import { PlantyFaceSvg, type PlantyVariant } from "@/components/brand/planty";

type PlantyMood = "happy" | "celebrate" | "tip" | "welcome";

/** Map academy moods to the official mascot variants. */
const MOOD_VARIANT: Record<PlantyMood, PlantyVariant> = {
  welcome: "main",
  happy: "happy",
  celebrate: "niceWork",
  tip: "thinking",
};

const MESSAGES: Record<PlantyMood, string[]> = {
  welcome: [
    "Welcome to PlantPal Academy! Let's grow smarter together.",
    "Ready to level up your gardening skills?",
  ],
  happy: [
    "You're doing great. Keep learning!",
    "Every lesson makes you a stronger gardener.",
  ],
  celebrate: [
    "Amazing work! That lesson is in the books!",
    "New badge earned? You're on fire!",
  ],
  tip: [
    "Tip: Complete one lesson a day to build your streak.",
    "Try a quiz. It's the fastest way to earn XP!",
  ],
};

interface PlantyProps {
  mood?: PlantyMood;
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Planty({ mood = "happy", message, size = "md", className }: PlantyProps) {
  const text = message ?? MESSAGES[mood][0];
  const sizes = { sm: 48, md: 72, lg: 96 };
  const px = sizes[size];

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div
        className="shrink-0 rounded-2xl bg-brand-primary flex items-center justify-center"
        style={{ width: px, height: px }}
        aria-hidden
      >
        <PlantyFaceSvg
          variant={MOOD_VARIANT[mood]}
          className={size === "sm" ? "w-7 h-7" : size === "md" ? "w-10 h-10" : "w-14 h-14"}
        />
      </div>
      <div className="relative flex-1 min-w-0">
        <div className="absolute -left-2 top-4 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-white" />
        <div className="rounded-2xl rounded-tl-sm bg-white border border-brand-sage/30 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-primary mb-1">
            Planty
          </p>
          <p className="text-sm text-brand-text leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

export function StreakFlame({ days, className }: { days: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold",
        days > 0 ? "text-orange-500" : "text-gray-400",
        className
      )}
    >
      <span className={cn("text-lg", days >= 7 && "animate-pulse")}>🔥</span>
      <span>{days} day{days === 1 ? "" : "s"}</span>
    </span>
  );
}

export function XpBar({
  current,
  needed,
  level,
  className,
}: {
  current: number;
  needed: number;
  level: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((current / needed) * 100));
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs font-medium text-gray-500">
        <span>Level {level}</span>
        <span>
          {current}/{needed} XP
        </span>
      </div>
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-growth transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

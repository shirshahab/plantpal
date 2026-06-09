"use client";

import { cn } from "@/lib/utils";

type PlantyMood = "happy" | "celebrate" | "tip" | "welcome";

const MESSAGES: Record<PlantyMood, string[]> = {
  welcome: [
    "Welcome to PlantPal Academy! Let's grow smarter together.",
    "Ready to level up your gardening skills?",
  ],
  happy: [
    "You're doing great — keep learning!",
    "Every lesson makes you a stronger gardener.",
  ],
  celebrate: [
    "Amazing work! That lesson is in the books!",
    "New badge unlocked? You're on fire!",
  ],
  tip: [
    "Tip: Complete one lesson a day to build your streak.",
    "Try a quiz — it's the fastest way to earn XP!",
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
        className="shrink-0 rounded-2xl bg-brand-primary flex items-center justify-center shadow-md shadow-brand-primary/20"
        style={{ width: px, height: px }}
        aria-hidden
      >
        <PlantyMark className={size === "sm" ? "w-7 h-7" : size === "md" ? "w-10 h-10" : "w-14 h-14"} />
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

/** Friendly leaf / P mark — mascot face */
function PlantyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden>
      <path
        d="M20 6C14 6 10 12 10 18c0 6 4 12 10 16 6-4 10-10 10-16 0-6-4-12-10-12z"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 34V22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="17" r="1.5" fill="white" />
      <circle cx="24" cy="17" r="1.5" fill="white" />
      <path d="M16 22q4 3 8 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
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

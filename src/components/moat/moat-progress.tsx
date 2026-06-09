"use client";

import { cn } from "@/lib/utils";

export function MoatProgressRing({
  value,
  max = 100,
  size = 72,
  label,
  sublabel,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const stroke = pct >= 75 ? "#16a34a" : pct >= 50 ? "#059669" : "#d97706";
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="shrink-0 -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ecfdf5" strokeWidth={6} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={6}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900 leading-none">{value}</span>
          {max !== 100 && (
            <span className="text-[10px] text-gray-400">/{max}</span>
          )}
        </div>
      </div>
      {label && <p className="text-xs font-semibold text-gray-700">{label}</p>}
      {sublabel && <p className="text-[10px] text-gray-400">{sublabel}</p>}
    </div>
  );
}

export function MoatProgressBar({
  value,
  max,
  color = "green",
  className,
}: {
  value: number;
  max: number;
  color?: "green" | "amber" | "blue";
  className?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    blue: "bg-sky-500",
  };

  return (
    <div className={cn("h-2 rounded-full bg-gray-100 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease-out", colors[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

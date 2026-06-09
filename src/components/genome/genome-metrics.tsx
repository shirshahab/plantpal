import { cn } from "@/lib/utils";

export function IntelligenceScoreRing({
  score,
  size = 56,
}: {
  score: number;
  size?: number;
}) {
  const stroke =
    score >= 75 ? "#6366f1" : score >= 50 ? "#8b5cf6" : score >= 30 ? "#a78bfa" : "#c4b5fd";
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ede9fe" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IntelligenceScoreBadge({ score }: { score: number }) {
  const label =
    score >= 80 ? "Highly mapped" : score >= 60 ? "Well tracked" : score >= 40 ? "Building" : "Early data";

  return (
    <div className="flex items-center gap-2">
      <IntelligenceScoreRing score={score} size={48} />
      <div>
        <p className="text-2xl font-bold text-indigo-700 leading-none">{score}</p>
        <p className="text-[10px] text-indigo-500 font-medium uppercase tracking-wide mt-0.5">
          Intelligence
        </p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export function ScoreBar({
  label,
  score,
  variant = "risk",
}: {
  label: string;
  score: number;
  variant?: "risk" | "recovery";
}) {
  const color =
    variant === "risk"
      ? score >= 60
        ? "bg-red-500"
        : score >= 35
          ? "bg-amber-500"
          : "bg-green-500"
      : score >= 60
        ? "bg-green-500"
        : score >= 35
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-900 font-semibold">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function TrendPill({
  direction,
  label,
}: {
  direction: "rising" | "stable" | "declining";
  label: string;
}) {
  const styles = {
    rising: "bg-emerald-50 text-emerald-700",
    stable: "bg-gray-100 text-gray-700",
    declining: "bg-red-50 text-red-700",
  };
  const arrow = direction === "rising" ? "↑" : direction === "declining" ? "↓" : "→";

  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", styles[direction])}>
      {arrow} {label}
    </span>
  );
}

export function ConsistencyBar({
  label,
  metric,
}: {
  label: string;
  metric: { score: number; label: string; detail: string };
}) {
  const color =
    metric.score >= 70 ? "bg-green-500" : metric.score >= 45 ? "bg-amber-500" : "bg-red-400";

  return (
    <div className="rounded-xl bg-white/80 border border-gray-100 px-3 py-2.5">
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
        <span className="text-[10px] font-medium text-gray-600">{metric.label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1.5">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${metric.score}%` }} />
      </div>
      <p className="text-[10px] text-gray-500 leading-relaxed">{metric.detail}</p>
    </div>
  );
}

export function StageBadge({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2 border text-center min-w-0",
        active ? "border-indigo-200 bg-indigo-50" : "border-gray-100 bg-gray-50"
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-gray-400 truncate">{label}</p>
      <p className={cn("text-xs font-semibold mt-0.5 capitalize truncate", active ? "text-indigo-800" : "text-gray-700")}>
        {value.replace(/_/g, " ")}
      </p>
    </div>
  );
}

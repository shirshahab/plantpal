import { cn } from "@/lib/utils";
import { getScoreBg, getScoreColor, getScoreLabel } from "@/lib/scoring";

export function HealthScoreBadge({
  score,
  size = "md",
  showLabel = true,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const label = getScoreLabel(score);
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        getScoreBg(score),
        sizes[size]
      )}
    >
      <span className={getScoreColor(score)}>{score}</span>
      {showLabel && (
        <span className="text-gray-600 font-medium text-[10px] sm:text-xs">{label}</span>
      )}
    </span>
  );
}

export function HealthScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const stroke = score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4} />
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

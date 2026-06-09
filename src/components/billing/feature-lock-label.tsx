import { Lock } from "lucide-react";
import { getFeatureLockLabel } from "@/lib/billing/feature-gates";
import { cn } from "@/lib/utils";

interface FeatureLockLabelProps {
  feature: string;
  className?: string;
}

export function FeatureLockLabel({ feature, className }: FeatureLockLabelProps) {
  const label = getFeatureLockLabel(feature);
  const isFamily = label === "Family Feature";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
        isFamily ? "bg-violet-100 text-violet-800" : "bg-amber-100 text-amber-800",
        className
      )}
    >
      <Lock className="w-3 h-3" aria-hidden />
      {label}
    </span>
  );
}

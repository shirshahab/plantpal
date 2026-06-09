import { cn } from "@/lib/utils";

export function BetaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
        "bg-brand-sage/15 text-brand-text-secondary border border-brand-sage/25",
        className
      )}
    >
      Beta
    </span>
  );
}

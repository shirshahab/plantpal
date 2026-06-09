import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  compact?: boolean;
}

export function EmptyState({
  icon = "🌱",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center bg-white rounded-2xl border border-gray-100",
        compact ? "py-10 px-5" : "py-16 px-6"
      )}
    >
      <span className={cn("block mb-4", compact ? "text-4xl" : "text-5xl")}>{icon}</span>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
        {actionLabel && actionHref && (
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
        {secondaryLabel && secondaryHref && (
          <Link href={secondaryHref}>
            <Button variant="outline">{secondaryLabel}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

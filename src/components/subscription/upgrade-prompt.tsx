import Link from "next/link";
import { Sparkles, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
  title: string;
  message: string;
  lockLabel?: "Plus Feature" | "Family Feature";
  className?: string;
  compact?: boolean;
  hidden?: boolean;
}

export function UpgradePrompt({
  title,
  message,
  lockLabel,
  className,
  compact = false,
  hidden = false,
}: UpgradePromptProps) {
  if (hidden) return null;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3",
          className
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden />
            {lockLabel && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                {lockLabel}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-amber-950 mt-1">{title}</p>
          <p className="text-xs text-amber-900/80 mt-0.5">{message}</p>
        </div>
        <Link href="/upgrade" className="shrink-0">
          <Button size="sm" className="touch-manipulation">
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card
      padding="md"
      className={cn(
        "border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/50",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-amber-700" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            {lockLabel && (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800 mb-1">
                {lockLabel}
              </p>
            )}
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{message}</p>
          </div>
          <Link href="/upgrade">
            <Button className="touch-manipulation">
              <Sparkles className="w-4 h-4" />
              View upgrade options
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

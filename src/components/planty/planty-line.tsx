import type { PlantyMessage } from "@/lib/copy/planty-messages-system";
import { plantyMoodToVariant } from "@/lib/copy/planty-messages-system";
import { PlantyAvatar } from "@/components/brand/planty";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PlantyLine({
  message,
  className,
  linkable = false,
}: {
  message: PlantyMessage;
  className?: string;
  linkable?: boolean;
}) {
  const variant = plantyMoodToVariant(message.mood);
  const inner = (
    <div
      className={cn(
        "flex items-start gap-3 text-sm text-emerald-900/90 bg-emerald-50/60 border border-emerald-100/80 rounded-xl px-3.5 py-2.5",
        className
      )}
    >
      <PlantyAvatar variant={variant} size={40} className="shrink-0" />
      <p className="leading-relaxed pt-1.5">{message.text}</p>
    </div>
  );

  if (linkable && message.target) {
    return (
      <Link href={message.target} className="block hover:opacity-95 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}

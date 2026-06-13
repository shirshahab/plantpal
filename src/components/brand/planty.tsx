import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { plantyMoodToVariant, type PlantyMood } from "@/lib/copy/planty-messages-system";

/**
 * Planty: the official PlantPal mascot.
 *
 * Source of truth: assets/brand/planty-source.png (the approved character
 * sheet). Individual mood assets are cropped from it by
 * scripts/crop-mascot.mjs. Do not redesign, simplify, or replace Planty.
 *
 * Usage rules (see /brand):
 * - Max one Planty per page.
 * - Small and subtle. Big only on empty, success, or onboarding states.
 * - Never on severe health warnings, expert review, legal, or payment pages.
 */

export type PlantyVariant =
  | "main"
  | "happy"
  | "thinking"
  | "celebrating"
  | "diagnosing"
  | "niceWork"
  | "uhOh";

/** Official artwork per variant, with intrinsic dimensions for aspect ratio. */
const ART: Record<PlantyVariant, { src: string; w: number; h: number }> = {
  main: { src: "/assets/mascot/planty-main.png", w: 370, h: 524 },
  happy: { src: "/assets/mascot/planty-happy.png", w: 171, h: 272 },
  thinking: { src: "/assets/mascot/planty-thinking.png", w: 155, h: 262 },
  celebrating: { src: "/assets/mascot/planty-celebrating.png", w: 217, h: 238 },
  diagnosing: { src: "/assets/mascot/planty-diagnosing.png", w: 151, h: 239 },
  niceWork: { src: "/assets/mascot/planty-nice-work.png", w: 160, h: 262 },
  uhOh: { src: "/assets/mascot/planty-uh-oh.png", w: 163, h: 253 },
};

const SIZE_PX = { sm: 44, md: 64, lg: 96 } as const;

export type PlantySize = keyof typeof SIZE_PX | number;

function resolveSize(size: PlantySize | undefined, subtle: boolean): number {
  if (typeof size === "number") return size;
  if (size) return SIZE_PX[size];
  return subtle ? SIZE_PX.sm : SIZE_PX.md;
}

/** The mascot artwork at a given height. Width follows the art's ratio. */
export function PlantyAvatar({
  variant = "main",
  size = "md",
  className,
}: {
  variant?: PlantyVariant;
  size?: PlantySize;
  className?: string;
}) {
  const px = resolveSize(size, false);
  const art = ART[variant];
  const width = Math.round((art.w / art.h) * px);
  return (
    <Image
      src={art.src}
      alt=""
      aria-hidden
      width={width}
      height={px}
      className={cn("shrink-0 select-none", className)}
      draggable={false}
    />
  );
}

interface PlantyProps {
  variant?: PlantyVariant;
  size?: PlantySize;
  className?: string;
  /** Optional one-liner shown next to Planty in a soft callout. */
  message?: string;
  /** Smaller, quieter rendering for inline use. */
  subtle?: boolean;
}

/**
 * Planty with an optional message callout.
 * Without a message it renders just the artwork.
 */
export function Planty({
  variant = "main",
  size,
  className,
  message,
  subtle = false,
}: PlantyProps) {
  const px = resolveSize(size, subtle);

  if (!message) {
    return <PlantyAvatar variant={variant} size={px} className={className} />;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <PlantyAvatar variant={variant} size={px} />
      <div
        className={cn(
          "rounded-2xl rounded-bl-sm px-4 py-2.5 text-left",
          subtle
            ? "bg-brand-sage/10 border border-brand-sage/20"
            : "bg-white border border-brand-sage/30 shadow-sm"
        )}
      >
        <p
          className={cn(
            "leading-snug text-brand-text",
            subtle ? "text-xs" : "text-sm"
          )}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

type PlantyMoodName = "happy" | "thinking" | "warning" | "celebrating";

const MOOD_TO_VARIANT: Record<PlantyMoodName, PlantyVariant> = {
  happy: "happy",
  thinking: "thinking",
  warning: "uhOh",
  celebrating: "celebrating",
};

/**
 * Mood-based mascot, e.g. <PlantyMood mood="happy" />.
 * Thin wrapper over Planty using the four official brand moods.
 */
export function PlantyMood({
  mood,
  size,
  message,
  subtle,
  className,
}: {
  mood: PlantyMoodName | PlantyMood;
  size?: PlantySize;
  message?: string;
  subtle?: boolean;
  className?: string;
}) {
  const variant =
    mood in MOOD_TO_VARIANT
      ? MOOD_TO_VARIANT[mood as PlantyMoodName]
      : plantyMoodToVariant(mood as PlantyMood);
  return (
    <Planty
      variant={variant}
      size={size}
      message={message}
      subtle={subtle}
      className={className}
    />
  );
}

/** "Planty says" tip box for blog posts and light in-app tips. */
export function PlantyTip({
  tip,
  className,
}: {
  tip: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-brand-sage/10 border border-brand-sage/25 p-4",
        className
      )}
    >
      <PlantyAvatar variant="happy" size="sm" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
          Planty says
        </p>
        <p className="text-sm text-brand-text leading-relaxed mt-1">{tip}</p>
      </div>
    </aside>
  );
}

/** Centered Planty for empty states. The one place Planty gets to be big. */
export function PlantyEmptyState({
  variant = "happy",
  title,
  message,
  className,
  children,
}: {
  variant?: PlantyVariant;
  title: string;
  message?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("text-center", className)}>
      <PlantyAvatar variant={variant} size="lg" className="mx-auto" />
      <h2 className="text-xl font-bold text-gray-900 mt-4">{title}</h2>
      {message && (
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      )}
      {children}
    </div>
  );
}

/** Planty celebrating a win. */
export function PlantySuccess({
  message,
  className,
  size = "md",
}: {
  message: string;
  className?: string;
  size?: PlantySize;
}) {
  return (
    <Planty
      variant="niceWork"
      size={size}
      message={message}
      className={className}
    />
  );
}

/** Friendly error state. Not for severe plant health warnings. */
export function PlantyError({
  title = "That didn't work.",
  message = "Plants are dramatic. Apps are too.",
  retryLabel,
  onRetry,
  homeHref,
  homeLabel,
  className,
}: {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  homeHref?: string;
  homeLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      <PlantyAvatar variant="uhOh" size="lg" className="mx-auto" />
      <h1 className="text-xl font-semibold text-gray-900 mt-4">{title}</h1>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">{message}</p>
      {(onRetry || homeHref) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          {onRetry && <Button onClick={onRetry}>{retryLabel ?? "Try again"}</Button>}
          {homeHref && (
            <Link href={homeHref}>
              <Button variant="outline">{homeLabel ?? "Go home"}</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";
import { OFFICIAL_APP_ICON } from "@/lib/brand/tokens";

/** Official PlantPal app icon — Living P squircle (PNG). Do not substitute SVG recreations. */
export function PlantPalIconTile({
  className,
  size = 36,
  priority = false,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src={OFFICIAL_APP_ICON}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}

export function PlantPalLogo({
  showWordmark = true,
  size = "md",
  className,
  priority = false,
}: {
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
}) {
  const sizes = {
    sm: { tile: 28, text: "text-base" },
    md: { tile: 36, text: "text-lg" },
    lg: { tile: 44, text: "text-xl" },
  };
  const s = sizes[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <PlantPalIconTile size={s.tile} priority={priority} className="shadow-sm shadow-brand-primary/10" />
      {showWordmark && (
        <span className={cn("font-heading font-semibold text-brand-text tracking-tight", s.text)}>
          PlantPal
        </span>
      )}
    </span>
  );
}

/** @deprecated Use PlantPalIconTile — official asset is PNG only. */
export function PlantPalMark(props: { className?: string; color?: string }) {
  return <PlantPalIconTile className={props.className} size={32} />;
}

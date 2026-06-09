import { cn } from "@/lib/utils";

const MARK_VIEWBOX = "0 0 32 32";

/** Official Living P — stem, leaf bowl, midrib vein. */
export function PlantPalMark({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d="M10.5 22.5V7.6c0 0 0-1.5 1.5-1.5 1.1 0 2 0.65 2.4 1.65.4 1.1 0.15 2.25-.65 3-.5.5-1.15.75-1.75.75H10.5"
        stroke={color}
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12.5 16.75 8"
        stroke={color}
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Squircle app icon tile with Living P mark. */
export function PlantPalIconTile({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="512" height="512" rx="112" fill="#2D6A4F" />
      <path
        d="M168 360V152c0 0 0-24 24-24 18 0 32 10 38 26 6 18 2 36-10 48-8 8-18 12-28 12H168"
        stroke="#FFFFFF"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M192 200 268 128" stroke="#FFFFFF" strokeWidth="26" strokeLinecap="round" />
    </svg>
  );
}

export function PlantPalLogo({
  showWordmark = true,
  size = "md",
  className,
}: {
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: { tile: 28, text: "text-base" },
    md: { tile: 36, text: "text-lg" },
    lg: { tile: 44, text: "text-xl" },
  };
  const s = sizes[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <PlantPalIconTile size={s.tile} className="shadow-sm shadow-brand-primary/15" />
      {showWordmark && (
        <span className={cn("font-heading font-semibold text-brand-text tracking-tight", s.text)}>
          PlantPal
        </span>
      )}
    </span>
  );
}

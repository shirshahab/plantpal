"use client";

import Link from "next/link";
import { PlantPalLogo } from "@/components/brand/plantpal-logo";
import { BetaBadge } from "@/components/brand/beta-badge";

export function MobileHeader({ title }: { title?: string }) {
  return (
    <header className="md:hidden sticky top-0 z-40 bg-brand-bg/95 backdrop-blur-lg border-b border-brand-sage/20 safe-top">
      <div className="flex items-center justify-between gap-2 px-4 h-14">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/dashboard" aria-label="PlantPal home">
            <PlantPalLogo showWordmark={false} size="sm" />
          </Link>
          <span className="font-heading font-semibold text-brand-text truncate">
            {title ?? "PlantPal"}
          </span>
          <BetaBadge />
        </div>
        <Link
          href="/"
          className="text-xs font-medium text-brand-primary hover:text-brand-primary/80 shrink-0 touch-manipulation"
        >
          Website
        </Link>
      </div>
    </header>
  );
}

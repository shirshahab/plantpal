import Link from "next/link";
import { PlantPalLogo } from "@/components/brand/plantpal-logo";
import { BetaBadge } from "@/components/brand/beta-badge";
import { BRAND } from "@/lib/brand/tokens";

const FOOTER_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Open App" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-brand-sage/25 bg-white mt-auto safe-bottom">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2">
              <PlantPalLogo size="sm" />
              <BetaBadge />
            </div>
            <p className="text-sm font-heading font-semibold text-brand-primary mt-3">
              {BRAND.tagline}
            </p>
            <p className="text-sm text-brand-text-secondary mt-2 max-w-xs leading-relaxed">
              The smart plant care coach for your home, yard, and garden.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-brand-text-secondary hover:text-brand-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 pt-6 border-t border-brand-sage/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-brand-text-secondary">
          <p>© {new Date().getFullYear()} PlantPal. All rights reserved.</p>
          <Link href="/waitlist" className="hover:text-brand-primary transition-colors">
            Join the waitlist →
          </Link>
        </div>
      </div>
    </footer>
  );
}

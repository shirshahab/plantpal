import Link from "next/link";
import { PlantPalLogo } from "@/components/brand/plantpal-logo";
import { BetaBadge } from "@/components/brand/beta-badge";
import { SocialLinks } from "@/components/marketing/social-links";
import { BRAND } from "@/lib/brand/tokens";

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/partners", label: "Partners" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-brand-sage/25 bg-white mt-auto safe-bottom">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <PlantPalLogo size="sm" />
              <BetaBadge />
            </div>
            <p className="text-sm font-heading font-semibold text-brand-primary mt-3">
              {BRAND.tagline}
            </p>
            <p className="text-sm text-brand-text-secondary mt-2 max-w-xs leading-relaxed">
              The app that helps you not kill your plants.
            </p>
            <SocialLinks className="mt-5" />
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <p className="text-xs font-semibold text-brand-text uppercase tracking-wide mb-3">
                {column.heading}
              </p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-text-secondary hover:text-brand-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlantPalLogo } from "@/components/brand/plantpal-logo";
import { SocialLinks } from "@/components/marketing/social-links";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-md border-b border-brand-sage/25 safe-top">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
          <PlantPalLogo size="md" priority />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-brand-text-secondary hover:text-brand-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button size="sm">Get Started Free</Button>
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-brand-text-secondary hover:bg-brand-sage/15 touch-manipulation"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden border-t border-brand-sage/20 bg-white/95 backdrop-blur-md overflow-hidden transition-all duration-200",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0 border-t-0"
        )}
      >
        <div className="px-4 py-4 space-y-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-sm font-medium text-brand-text py-2"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-brand-sage/20">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="md" className="w-full">
                Login
              </Button>
            </Link>
            <Link href="/onboarding" onClick={() => setOpen(false)}>
              <Button size="md" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </div>
          <div className="pt-3 border-t border-brand-sage/20 flex justify-center">
            <SocialLinks className="gap-6" />
          </div>
        </div>
      </div>
    </header>
  );
}

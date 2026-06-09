"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlantPalLogo } from "@/components/brand/plantpal-logo";
import { BetaBadge } from "@/components/brand/beta-badge";
import { DemoButton } from "@/components/marketing/demo-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "App" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-md border-b border-brand-sage/25 safe-top">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
          <PlantPalLogo size="md" priority />
          <BetaBadge className="hidden sm:inline-flex" />
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
          <DemoButton variant="outline" size="sm" label="Try Demo" />
          <Link href="/waitlist">
            <Button size="sm">Start Growing</Button>
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
            <DemoButton variant="outline" size="md" label="Try Demo" className="w-full" />
            <Link href="/waitlist" onClick={() => setOpen(false)}>
              <Button size="md" className="w-full">
                Start Growing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

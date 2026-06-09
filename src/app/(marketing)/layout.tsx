import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { BRAND } from "@/lib/brand/tokens";

export const metadata: Metadata = {
  title: {
    default: "PlantPal | Grow with confidence.",
    template: "%s | PlantPal",
  },
  description: BRAND.oneLiner,
  keywords: [
    "plant care app",
    "plant tracker",
    "plant diagnosis",
    "garden app",
    "houseplant care",
    "fruit tree care",
    "local plant advice",
    "grow with confidence",
  ],
  openGraph: {
    title: "PlantPal | Grow with confidence.",
    description: BRAND.oneLiner,
    type: "website",
    siteName: "PlantPal",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlantPal | Grow with confidence.",
    description: BRAND.oneLiner,
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <MarketingHeader />
      <main className="flex-1 page-enter">{children}</main>
      <MarketingFooter />
    </div>
  );
}

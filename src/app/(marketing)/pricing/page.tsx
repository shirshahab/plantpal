import type { Metadata } from "next";
import PricingPageClient from "@/components/marketing/pricing-page-client";
import { WaitlistCta } from "@/components/marketing/waitlist-cta";
import { absoluteUrl } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: "PlantPal Pro and Family plans with a 14-day free trial. Start caring for your plants the smart way.",
  alternates: { canonical: absoluteUrl("/pricing") },
  openGraph: {
    title: "PlantPal Pricing",
    description: "PlantPal Pro and Family plans with a 14-day free trial.",
    url: absoluteUrl("/pricing"),
  },
};

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <PricingPageClient />
      <WaitlistCta
        heading="Free is a great price."
        subheading="Start with a 14-day free trial. Cancel anytime."
        source="pricing"
        className="mt-20 px-0 sm:px-0"
      />
    </div>
  );
}

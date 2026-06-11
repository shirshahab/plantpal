import type { Metadata } from "next";
import PricingPageClient from "@/components/marketing/pricing-page-client";
import { WaitlistCta } from "@/components/marketing/waitlist-cta";
import { absoluteUrl } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: "PlantPal is free during beta. Paid plans come later.",
  alternates: { canonical: absoluteUrl("/pricing") },
  openGraph: {
    title: "PlantPal Pricing",
    description: "PlantPal is free during beta. Paid plans come later.",
    url: absoluteUrl("/pricing"),
  },
};

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <PricingPageClient />
      <WaitlistCta
        heading="Free is a great price."
        subheading="Get PlantPal free during beta."
        source="pricing"
        className="mt-20 px-0 sm:px-0"
      />
    </div>
  );
}

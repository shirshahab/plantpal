import type { Metadata } from "next";
import PricingPageClient from "@/components/marketing/pricing-page-client";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "PlantPal pricing — Free, Plus ($7.99/mo), and Family ($14.99/mo) plans for every gardener.",
};

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <PricingPageClient />
    </div>
  );
}

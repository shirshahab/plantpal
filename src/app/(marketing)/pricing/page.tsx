import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple early-access pricing for PlantPal — Free, Plus, and Family plans.",
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Start tracking your first plants.",
    featured: false,
    features: ["3 plants", "Basic reminders", "Basic lessons"],
  },
  {
    name: "PlantPal Plus",
    price: "$5.99",
    period: "/month",
    description: "For serious plant parents and gardeners.",
    featured: true,
    features: [
      "Unlimited plants",
      "AI diagnosis",
      "Local climate intelligence",
      "Growth timeline",
      "Price checker",
      "Advanced lessons",
    ],
  },
  {
    name: "Family / Home",
    price: "$12.99",
    period: "/month",
    description: "For households and full properties.",
    featured: false,
    features: [
      "Full property mode",
      "Multiple gardens",
      "Advanced reminders",
      "Shared household access",
      "Priority AI scans",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-medium text-brand-primary uppercase tracking-wide mb-3 font-heading">
          Pricing
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-text tracking-tight">
          Simple plans for every garden
        </h1>
        <p className="text-brand-text-secondary mt-4 leading-relaxed">
          Start free. Upgrade when you want AI diagnosis, unlimited plants, and full-property mode.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "rounded-2xl border p-6 sm:p-8 flex flex-col",
              plan.featured
                ? "border-brand-primary bg-white shadow-lg shadow-brand-primary/10 ring-1 ring-brand-primary/20"
                : "border-brand-sage/25 bg-white shadow-sm"
            )}
          >
            {plan.featured && (
              <span className="text-xs font-semibold text-brand-primary bg-brand-sage/20 px-2.5 py-1 rounded-full w-fit mb-4">
                Most popular
              </span>
            )}
            <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
              <span className="text-sm text-gray-500">{plan.period}</span>
            </div>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">{plan.description}</p>
            <ul className="mt-6 space-y-3 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-brand-growth shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/waitlist" className="mt-8 block">
              <Button
                variant={plan.featured ? "primary" : "outline"}
                size="lg"
                className="w-full"
              >
                Join Waitlist
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-400 mt-10">
        Pricing may change during early access.
      </p>
    </div>
  );
}

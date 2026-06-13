import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatPrice,
  LAUNCH_TRIAL_DAYS,
  OFFICIAL_PRICING,
  PRO_MONTHLY_PRICE,
} from "@/lib/billing/pricing";

const PRO_PERKS = [
  "Unlimited plant scans",
  "Plant Doctor and care plans",
  "Full Academy and Garden Designer",
  "Local weather alerts",
];

export default function PricingPageClient() {
  const pro = OFFICIAL_PRICING.pro;
  const family = OFFICIAL_PRICING.family;

  return (
    <>
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-brand-text tracking-tight leading-[1.05]">
          Try every feature free for {LAUNCH_TRIAL_DAYS} days.
        </h1>
        <p className="text-lg text-brand-text-secondary mt-6 leading-relaxed">
          Then keep growing with PlantPal Pro from {formatPrice(PRO_MONTHLY_PRICE)}/month.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl border-2 border-brand-primary shadow-sm p-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <h2 className="font-heading text-xl font-bold text-brand-text">PlantPal Pro</h2>
          </div>
          <p className="font-heading text-5xl font-bold text-brand-text">
            {formatPrice(pro.monthly)}
            <span className="text-lg font-medium text-brand-text-secondary">/mo</span>
          </p>
          <p className="text-brand-text-secondary mt-3">
            {LAUNCH_TRIAL_DAYS}-day free trial. Cancel anytime.
          </p>
          <ul className="mt-6 space-y-2.5">
            {PRO_PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-sm text-brand-text">
                <Check className="w-4 h-4 text-brand-growth mt-0.5 shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
          <Link href="/onboarding" className="block mt-8">
            <Button size="lg" className="w-full h-13">
              Start {LAUNCH_TRIAL_DAYS}-day free trial
            </Button>
          </Link>
        </div>

        <div className="bg-brand-bg rounded-3xl border border-brand-sage/30 p-8">
          <h2 className="font-heading text-xl font-bold text-brand-text">PlantPal Pro Family</h2>
          <p className="font-heading text-4xl font-bold text-brand-text mt-4">
            {formatPrice(family.monthly)}
            <span className="text-lg font-medium text-brand-text-secondary">/mo</span>
          </p>
          <p className="text-brand-text-secondary mt-3">
            Pro for the whole household. {formatPrice(family.annual)}/year saves{" "}
            {family.annualSavingsPercent}%.
          </p>
          <Link href="/upgrade" className="block mt-8">
            <Button variant="outline" size="lg" className="w-full h-13">
              See plans
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-center text-sm text-brand-text-secondary mt-10">
        After your free trial, your subscription renews automatically unless canceled.
      </p>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand/tokens";
import { BetaBadge } from "@/components/brand/beta-badge";

export const metadata: Metadata = {
  title: "Beta Program",
  description: "Join the PlantPal beta and help shape the smart plant care coach.",
};

const FEEDBACK_NEEDS = [
  "Onboarding and adding your first plant",
  "Daily tasks and care plans",
  "Scanner (identify, diagnose, nursery tags)",
  "Local climate tips for your ZIP code",
  "Anything confusing or broken",
];

export default function BetaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="flex items-center gap-2 mb-4">
        <BetaBadge />
        <span className="text-sm font-medium text-brand-text-secondary">Early access</span>
      </div>

      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-text tracking-tight leading-tight">
        PlantPal Beta — grow with us
      </h1>
      <p className="text-lg text-brand-primary font-heading font-semibold mt-4">{BRAND.tagline}</p>

      <div className="mt-10 space-y-8 text-brand-text-secondary leading-relaxed">
        <section>
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            What PlantPal does
          </h2>
          <p>
            PlantPal is your smart plant care coach. Track every plant, get daily tasks, generate
            care plans tuned to your ZIP code, and scan photos when something looks off.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            Who it&apos;s for
          </h2>
          <p>
            Home growers, houseplant lovers, fruit tree owners, and anyone who wants clear next
            steps instead of guessing when to water, fertilize, or troubleshoot.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            What beta users get
          </h2>
          <ul className="space-y-2">
            {[
              "Early access to the full app before public launch",
              "Every feature unlocked during the beta",
              "Direct line for feedback — we read every note",
              "Influence what we ship next",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-brand-text mb-3">
            What feedback we need
          </h2>
          <ul className="space-y-2">
            {FEEDBACK_NEEDS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 mt-2" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Link href="/waitlist?source=beta">
            <Button size="lg" className="w-full sm:w-auto">
              Join the beta
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Start My Garden
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

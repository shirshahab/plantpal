import Link from "next/link";
import { Check, Sprout, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";

const FREE_PERKS = [
  "Plant Scanner and Plant Doctor",
  "Care plans and local alerts",
  "Academy, Garden Feed, Price Checker",
  "Garden Designer",
];

export default function PricingPageClient() {
  return (
    <>
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-brand-text tracking-tight leading-[1.05]">
          Free while we&apos;re in beta.
        </h1>
        <p className="text-lg text-brand-text-secondary mt-6 leading-relaxed">
          Use the full app now. We&apos;ll add paid plans later.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl border-2 border-brand-primary shadow-sm p-8">
          <div className="flex items-center gap-2 mb-4">
            <Sprout className="w-5 h-5 text-brand-primary" />
            <h2 className="font-heading text-xl font-bold text-brand-text">Free Beta</h2>
          </div>
          <p className="font-heading text-5xl font-bold text-brand-text">$0</p>
          <p className="text-brand-text-secondary mt-3">
            All features included for early users.
          </p>
          <ul className="mt-6 space-y-2.5">
            {FREE_PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-sm text-brand-text">
                <Check className="w-4 h-4 text-brand-growth mt-0.5 shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
          <Link href="/onboarding" className="block mt-8">
            <Button size="lg" className="w-full h-13">
              Get Started Free
            </Button>
          </Link>
        </div>

        <div className="bg-brand-bg rounded-3xl border border-brand-sage/30 p-8">
          <div className="flex items-center gap-2 mb-4">
            <TreePine className="w-5 h-5 text-brand-text-secondary" />
            <h2 className="font-heading text-xl font-bold text-brand-text">Future Pro</h2>
          </div>
          <p className="font-heading text-3xl font-bold text-brand-text-secondary">
            Coming soon
          </p>
          <p className="text-brand-text-secondary mt-3">
            For people with serious gardens, yards, and crops.
          </p>
          <Link href="/waitlist" className="block mt-8">
            <Button variant="outline" size="lg" className="w-full h-13">
              Join Waitlist
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-center text-sm text-brand-text-secondary mt-10">
        Beta users keep early-supporter perks when paid plans arrive.
      </p>
    </>
  );
}

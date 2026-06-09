import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand/tokens";

export const metadata: Metadata = {
  title: "About",
  description: BRAND.mission,
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <p className="text-sm font-medium text-brand-primary uppercase tracking-wide mb-3 font-heading">
        About PlantPal
      </p>
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-text tracking-tight leading-tight">
        Built for people who love plants — but don&apos;t want to guess anymore.
      </h1>
      <p className="text-lg text-brand-primary font-heading font-semibold mt-6">{BRAND.tagline}</p>

      <div className="mt-10 space-y-6 text-brand-text-secondary leading-relaxed">
        <p>
          Plants don&apos;t come with instructions. You buy houseplants, fruit trees, bonsai, garden
          plants, and landscape trees — then spend months wondering: Am I watering correctly? Why are
          the leaves turning yellow? Should I fertilize now? What should I do next?
        </p>
        <p>
          PlantPal is not a plant encyclopedia, a watering reminder app, or a generic identification
          tool. PlantPal is the <strong className="text-brand-text">smart plant care coach</strong>{" "}
          that helps you know exactly what to do next.
        </p>

        <h2 className="font-heading text-xl font-semibold text-brand-text pt-4">Our mission</h2>
        <p>{BRAND.mission}</p>

        <h2 className="font-heading text-xl font-semibold text-brand-text pt-4">Our vision</h2>
        <p>{BRAND.vision}</p>

        <h2 className="font-heading text-xl font-semibold text-brand-text pt-4">Our promise</h2>
        <p>{BRAND.promise}</p>

        <blockquote className="border-l-4 border-brand-growth pl-4 text-brand-text italic">
          {BRAND.positioning}
        </blockquote>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row gap-3">
        <Link href="/waitlist">
          <Button size="lg">Start Growing</Button>
        </Link>
        <Link href="/features">
          <Button variant="outline" size="lg">
            See Features
          </Button>
        </Link>
      </div>
    </div>
  );
}

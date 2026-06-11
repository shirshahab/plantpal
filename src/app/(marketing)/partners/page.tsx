import type { Metadata } from "next";
import Link from "next/link";
import { Flower2, GraduationCap, Shovel, Sprout, Store, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { absoluteUrl, SUPPORT_EMAIL } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Partner with PlantPal. We're building the plant care engine for the next generation of gardeners and growers.",
  alternates: { canonical: absoluteUrl("/partners") },
  openGraph: {
    title: "Partner with PlantPal",
    description:
      "Partner with PlantPal. We're building the plant care engine for the next generation of gardeners and growers.",
    url: absoluteUrl("/partners"),
  },
};

const PARTNER_TYPES = [
  { icon: Store, label: "Nurseries" },
  { icon: Shovel, label: "Landscapers" },
  { icon: Sprout, label: "Growers" },
  { icon: Flower2, label: "Garden centers" },
  { icon: Video, label: "Creators" },
  { icon: GraduationCap, label: "Plant educators" },
];

export default function PartnersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="font-heading text-4xl sm:text-6xl font-bold text-brand-text tracking-tight leading-[1.05]">
        Partner with PlantPal.
      </h1>
      <p className="text-lg text-brand-text-secondary mt-6 leading-relaxed">
        We&apos;re building the plant care engine for the next generation of gardeners,
        growers, and plant killers in recovery.
      </p>

      <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {PARTNER_TYPES.map((type) => (
          <div
            key={type.label}
            className="bg-white rounded-2xl border border-brand-sage/25 p-5 text-center"
          >
            <type.icon className="w-6 h-6 text-brand-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-brand-text">{type.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white rounded-3xl border border-brand-sage/25 p-8 text-center">
        <h2 className="font-heading text-2xl font-bold text-brand-text tracking-tight">
          Want in early?
        </h2>
        <p className="text-brand-text-secondary mt-3 max-w-md mx-auto">
          Partnership programs open after public launch. Reach out now and you&apos;ll be
          first on the list.
        </p>
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Partnership inquiry`} className="inline-block mt-6">
          <Button size="lg" className="min-w-[200px] h-14 text-base">
            Contact Us
          </Button>
        </a>
        <p className="text-xs text-brand-text-secondary mt-4">
          Or email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          with the subject &ldquo;Partnership&rdquo;.
        </p>
      </div>

      <p className="text-center mt-10">
        <Link href="/contact" className="text-sm text-brand-primary hover:underline">
          General questions? Head to Contact.
        </Link>
      </p>
    </div>
  );
}

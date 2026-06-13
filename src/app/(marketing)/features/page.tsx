import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  CloudSun,
  Database,
  GraduationCap,
  Palette,
  ScanLine,
  Stethoscope,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaitlistCta } from "@/components/marketing/waitlist-cta";
import { absoluteUrl } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Features",
  description: "Scan plants, fix problems, and grow without guessing.",
  alternates: { canonical: absoluteUrl("/features") },
  openGraph: {
    title: "PlantPal Features",
    description: "Scan plants, fix problems, and grow without guessing.",
    url: absoluteUrl("/features"),
  },
};

const FEATURES = [
  {
    icon: ScanLine,
    title: "Plant Scanner",
    copy: "Point your camera at a plant. Find out what it is in seconds.",
  },
  {
    icon: Stethoscope,
    title: "Plant Doctor",
    copy: "Yellow leaves, bugs, spots, sad stems. Photograph the problem, get a fix.",
  },
  {
    icon: CalendarCheck,
    title: "Care Plans",
    copy: "Watering, feeding, pruning. One simple list of what to do today.",
  },
  {
    icon: CloudSun,
    title: "Local Alerts",
    copy: "Heat waves, frost, wind. Your ZIP code changes the advice.",
  },
  {
    icon: GraduationCap,
    title: "Academy",
    copy: "Three-minute lessons. Real skills. Zero lectures.",
  },
  {
    icon: Users,
    title: "Garden Feed",
    copy: "Friends and family share plants, wins, and the occasional casualty.",
  },
  {
    icon: Tag,
    title: "Price Checker",
    copy: "Know what a fair price looks like before the nursery does.",
  },
  {
    icon: Palette,
    title: "Garden Designer",
    copy: "Photo of your yard in. Design, plant list, and budget out.",
  },
  {
    icon: Database,
    title: "Plant Database",
    copy: "180+ species with care guides that get to the point.",
  },
  {
    icon: TrendingUp,
    title: "Growth Tracking",
    copy: "Progress photos and timelines. Watch the comeback story.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-brand-text tracking-tight leading-[1.05]">
          Everything your plants wish you knew.
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="bg-white rounded-2xl border border-brand-sage/25 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-xl bg-brand-sage/15 flex items-center justify-center mb-4">
              <f.icon className="w-5 h-5 text-brand-primary" />
            </div>
            <h2 className="font-heading text-lg font-bold text-brand-text">{f.title}</h2>
            <p className="text-sm text-brand-text-secondary mt-2 leading-relaxed">{f.copy}</p>
          </article>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link href="/onboarding">
          <Button size="lg" className="min-w-[200px] h-14 text-base">
            Get Started Free
          </Button>
        </Link>
        <p className="text-sm text-brand-text-secondary mt-4">No green thumb required.</p>
      </div>

      <WaitlistCta
        heading="Your plants deserve a lawyer."
        subheading="Join the waitlist and we'll send you in."
        source="features"
        className="mt-20 px-0 sm:px-0"
      />
    </div>
  );
}

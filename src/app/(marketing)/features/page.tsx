import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  CloudSun,
  Database,
  Leaf,
  ScanLine,
  Tag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand/tokens";

export const metadata: Metadata = {
  title: "Features",
  description: BRAND.oneLiner,
};

const FEATURES = [
  {
    icon: Leaf,
    title: "Plant tracking",
    copy: "Build a digital garden for every plant — photos, notes, care history, and goals in one place.",
    gradient: "from-green-100 to-emerald-50",
  },
  {
    icon: ScanLine,
    title: "AI plant doctor",
    copy: "Snap a photo of yellow leaves, pests, or damage. PlantPal suggests what to do today and what to avoid.",
    gradient: "from-lime-100 to-green-50",
  },
  {
    icon: CloudSun,
    title: "Local climate intelligence",
    copy: "Care advice adapts to your ZIP code, weather, season, and USDA zone — not generic blog posts.",
    gradient: "from-sky-100 to-blue-50",
  },
  {
    icon: CalendarCheck,
    title: "Daily care tasks",
    copy: "Open Today and see watering, fertilizing, pruning, health checks, and weather-aware seasonal tasks.",
    gradient: "from-amber-100 to-orange-50",
  },
  {
    icon: Database,
    title: "Plant database",
    copy: "Search 180+ species with care guides, soil preferences, pest risks, and hardiness zones.",
    gradient: "from-teal-100 to-cyan-50",
  },
  {
    icon: Tag,
    title: "Price checker",
    copy: "Know fair price ranges before buying at the nursery. Learn red flags and what to inspect.",
    gradient: "from-violet-100 to-purple-50",
  },
  {
    icon: BookOpen,
    title: "Learning hub",
    copy: "Short lessons on soil, watering, pruning, pests, fruiting, flowering, and bonsai basics.",
    gradient: "from-rose-100 to-pink-50",
  },
  {
    icon: TrendingUp,
    title: "Growth timeline",
    copy: "Log progress photos and measurements. Watch your plants grow over weeks and seasons.",
    gradient: "from-emerald-100 to-green-50",
  },
];

export default function FeaturesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-medium text-brand-primary uppercase tracking-wide mb-3 font-heading">
          Features
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-text tracking-tight">
          Everything you need to grow with confidence
        </h1>
        <p className="text-brand-text-secondary mt-4 leading-relaxed">
          PlantPal combines tracking, diagnosis, local intelligence, and daily guidance in one
          clean app.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className={`h-36 bg-gradient-to-br ${f.gradient} flex items-center justify-center`}>
              <div className="w-16 h-16 rounded-2xl bg-brand-sage/15 backdrop-blur flex items-center justify-center shadow-sm">
                <f.icon className="w-8 h-8 text-brand-primary" />
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <h2 className="font-heading text-xl font-semibold text-brand-text">{f.title}</h2>
              <p className="text-sm text-brand-text-secondary mt-3 leading-relaxed">{f.copy}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link href="/waitlist">
          <Button size="lg">Start Growing</Button>
        </Link>
      </div>
    </div>
  );
}

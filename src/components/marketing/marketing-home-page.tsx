"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  Camera,
  ChevronRight,
  CloudSun,
  Database,
  GraduationCap,
  Leaf,
  MapPin,
  ScanLine,
  Sprout,
  Tag,
  Target,
  TrendingUp,
  TreePine,
  Home,
  Flower2,
  Apple,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoButton } from "@/components/marketing/demo-button";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { BRAND } from "@/lib/brand/tokens";

const PROBLEMS = [
  "Forgetting when to water",
  "Yellow leaves you can't explain",
  "Pest issues that spread before you notice",
  "Confusing care instructions on nursery tags",
  "Wrong plants for your local climate",
  "Expensive plant mistakes",
];

const SOLUTION_CARDS = [
  { icon: CalendarCheck, title: "Daily tasks" },
  { icon: ScanLine, title: "AI plant doctor" },
  { icon: Camera, title: "Photo diagnosis" },
  { icon: CloudSun, title: "Climate intelligence" },
  { icon: TrendingUp, title: "Growth tracking" },
  { icon: Target, title: "Plant goals" },
  { icon: Database, title: "Plant database" },
  { icon: Tag, title: "Price checker" },
];

const CONFIDENCE_PILLARS = [
  "Plant tracking",
  "AI guidance",
  "Local climate intelligence",
  "Personalized goals",
  "Education",
  "Progress tracking",
];

const STEPS = [
  { n: "1", title: "Add your plant", desc: "Name it, pick species, set location and goals." },
  { n: "2", title: "Choose your goals", desc: "More fruit, low maintenance, or bonsai development." },
  { n: "3", title: "Get a care plan", desc: "Personalized for your climate and goals." },
  { n: "4", title: "Track progress", desc: "Photos, growth timeline, and health scans." },
  { n: "5", title: "Fix problems early", desc: "Catch yellow leaves and pests before they spread." },
];

const USE_CASES = [
  { icon: Sprout, title: "Houseplants", desc: "Fiddle leaf figs, pothos, and indoor favorites." },
  { icon: Apple, title: "Fruit trees", desc: "Citrus, avocado, and backyard harvests." },
  { icon: TreePine, title: "Bonsai", desc: "Shape, prune, and track slow growth." },
  { icon: Home, title: "Backyards", desc: "Full-yard care with local weather tasks." },
  { icon: Flower2, title: "Vegetable gardens", desc: "Seasonal beds and raised planters." },
  { icon: MapPin, title: "New homeowners", desc: "Learn what you inherited in the yard." },
];

export function MarketingHomePage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <p className="text-sm font-medium text-brand-primary tracking-wide mb-2 font-heading">
              PlantPal
            </p>
            <p className="text-sm text-brand-text-secondary mb-6">{BRAND.tagline}</p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-brand-text tracking-tight leading-[1.08]">
              Because plants don&apos;t come with instructions.
            </h1>
            <p className="text-lg sm:text-xl text-brand-text-secondary mt-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Track every plant, diagnose problems with photos, get local care advice, and know
              exactly what to do next.
            </p>
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mt-10">
              <Link href="/waitlist">
                <Button size="lg" className="min-w-[200px] h-14">
                  Start Growing
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <DemoButton label="Explore Demo" size="lg" className="min-w-[200px] h-14" />
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-white border-y border-brand-sage/20 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-text tracking-tight">
            Plants should not feel like guesswork.
          </h2>
          <p className="text-brand-text-secondary mt-4 leading-relaxed max-w-lg mx-auto">
            You buy houseplants, fruit trees, bonsai, and garden plants — then spend months wondering
            if you&apos;re doing it right. PlantPal removes the uncertainty.
          </p>
          <ul className="mt-10 space-y-4 text-left max-w-md mx-auto">
            {PROBLEMS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-brand-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-growth mt-2 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Solution */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-text tracking-tight">
            PlantPal tells you what to do next.
          </h2>
          <p className="text-brand-text-secondary mt-4 leading-relaxed">
            Not a plant encyclopedia. Not just reminders. The smart plant care coach.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {SOLUTION_CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-sage/25 shadow-sm text-center hover:border-brand-sage hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-sage/15 flex items-center justify-center mx-auto mb-3">
                <card.icon className="w-5 h-5 text-brand-primary" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-brand-text">{card.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Grow with confidence */}
      <section className="bg-white border-y border-brand-sage/20 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-text tracking-tight">
                Grow with confidence.
              </h2>
              <p className="text-brand-text-secondary mt-4 leading-relaxed">
                PlantPal combines everything you need into one simple experience — so you spend less
                time guessing and more time enjoying your plants.
              </p>
              <ul className="mt-8 space-y-3">
                {CONFIDENCE_PILLARS.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-brand-text">
                    <Check className="w-4 h-4 text-brand-growth shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Leaf,
                  title: "Track every plant",
                  copy: "Digital garden with schedules, photos, notes, and goals.",
                },
                {
                  icon: Target,
                  title: "Goal-based plans",
                  copy: "More fruit, low maintenance, or bonsai — different plans for different goals.",
                },
                {
                  icon: GraduationCap,
                  title: "Learn as you grow",
                  copy: "Short lessons on soil, watering, pests, and seasonal care.",
                },
                {
                  icon: MapPin,
                  title: "Local advice",
                  copy: "Recommendations based on your ZIP, weather, and growing zone.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl p-5 border border-brand-sage/25 bg-brand-bg"
                >
                  <f.icon className="w-5 h-5 text-brand-primary mb-3" />
                  <h3 className="font-heading font-semibold text-brand-text text-sm">{f.title}</h3>
                  <p className="text-xs text-brand-text-secondary mt-2 leading-relaxed">{f.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-text text-center tracking-tight mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="relative bg-white rounded-2xl p-5 border border-brand-sage/25 shadow-sm"
            >
              <span className="text-3xl font-heading font-bold text-brand-sage/40">{step.n}</span>
              <h3 className="font-heading font-semibold text-brand-text mt-2">{step.title}</h3>
              <p className="text-xs text-brand-text-secondary mt-2 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="bg-brand-sage/10 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-text text-center tracking-tight mb-12">
            Built for every kind of grower
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="bg-white rounded-2xl p-6 border border-brand-sage/25 shadow-sm"
              >
                <uc.icon className="w-6 h-6 text-brand-primary mb-3" />
                <h3 className="font-heading font-semibold text-brand-text">{uc.title}</h3>
                <p className="text-sm text-brand-text-secondary mt-2 leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="bg-brand-primary rounded-3xl p-8 sm:p-12 text-white text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
            See PlantPal in action.
          </h2>
          <p className="text-brand-sage mt-4 max-w-xl mx-auto leading-relaxed">
            Explore a demo garden with citrus, avocado, bougainvillea, Japanese maple, and indoor
            plants.
          </p>
          <div className="mt-8">
            <DemoButton
              label="Explore Demo"
              variant="secondary"
              size="lg"
              className="min-w-[200px] bg-white text-brand-primary hover:bg-brand-bg"
            />
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-text tracking-tight">
            {BRAND.tagline}
          </h2>
          <p className="text-brand-text-secondary mt-3 leading-relaxed">
            Join the PlantPal waitlist and get early access when we launch.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-brand-sage/25 shadow-sm p-6 sm:p-8">
          <WaitlistForm variant="compact" source="homepage" />
        </div>
        <p className="text-center mt-4">
          <Link href="/waitlist" className="text-sm text-brand-primary hover:underline">
            Full signup form →
          </Link>
        </p>
      </section>
    </>
  );
}

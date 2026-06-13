"use client";

import Link from "next/link";
import {
  CloudSun,
  GraduationCap,
  Palette,
  ScanLine,
  Stethoscope,
  CalendarCheck,
  Tag,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { WaitlistCta } from "@/components/marketing/waitlist-cta";
import { Planty } from "@/components/brand/planty";

const FEATURES = [
  { icon: ScanLine, title: "Plant Scanner", copy: "Know what it is." },
  { icon: Stethoscope, title: "Plant Doctor", copy: "Find out what's wrong." },
  { icon: CalendarCheck, title: "Care Plans", copy: "Know what to do next." },
  { icon: CloudSun, title: "Local Alerts", copy: "Weather matters. Your ZIP code matters." },
  { icon: GraduationCap, title: "Academy", copy: "Learn plants without falling asleep." },
  { icon: Users, title: "Garden Feed", copy: "See what friends and family are growing." },
  { icon: Tag, title: "Price Checker", copy: "Don't get ripped off at the nursery." },
  { icon: Palette, title: "Garden Designer", copy: "Plan the yard before you blow the budget." },
];

const DOES_CARDS = [
  {
    title: "Identify it.",
    copy: "Snap a photo and find out what plant you're dealing with.",
  },
  {
    title: "Fix it.",
    copy: "Upload sick leaves, bugs, spots, or sad-looking stems. Get a clear action plan.",
  },
  {
    title: "Grow it.",
    copy: "Track watering, feeding, photos, lessons, and progress.",
  },
];

export function MarketingHomePage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-brand-text tracking-tight leading-[1.02]">
              Stop killing
              <br />
              your plants.
            </h1>
            <p className="text-lg sm:text-xl text-brand-text-secondary mt-6 leading-relaxed max-w-md mx-auto lg:mx-0">
              PlantPal tells you what your plants are, what&apos;s wrong with them, and
              what to do next.
            </p>
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mt-10">
              <Link href="/onboarding">
                <Button size="lg" className="min-w-[200px] h-14 text-base">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" size="lg" className="min-w-[200px] h-14 text-base">
                  See How It Works
                </Button>
              </Link>
            </div>
            <p className="text-sm text-brand-text-secondary mt-5">No green thumb required.</p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <PhoneMockup />
              {/* Planty waving from the corner. Small, friendly, out of the way. */}
              <div className="absolute -bottom-4 -left-4 sm:-left-16 flex items-end gap-2">
                <Planty variant="main" size={88} />
                <p className="hidden sm:block mb-8 rounded-2xl rounded-bl-sm bg-white border border-brand-sage/30 shadow-sm px-3 py-2 text-xs text-brand-text">
                  I help you not kill your plants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain */}
      <section className="bg-white border-y border-brand-sage/20 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading text-3xl sm:text-5xl font-bold text-brand-text tracking-tight">
            Plants are dramatic.
          </h2>
          <p className="text-lg text-brand-text-secondary mt-6 leading-relaxed max-w-xl mx-auto">
            Yellow leaves. Weird spots. Crispy edges. Random death. PlantPal helps you
            figure out what&apos;s going on before your plant becomes compost.
          </p>
        </div>
      </section>

      {/* What PlantPal does */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <h2 className="font-heading text-3xl sm:text-5xl font-bold text-brand-text text-center tracking-tight mb-14">
          Your plant coach in your pocket.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {DOES_CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-3xl p-8 border border-brand-sage/25 shadow-sm"
            >
              <h3 className="font-heading text-2xl font-bold text-brand-text">{card.title}</h3>
              <p className="text-brand-text-secondary mt-3 leading-relaxed">{card.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Core features */}
      <section className="bg-white border-y border-brand-sage/20 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-5 sm:p-6 border border-brand-sage/25 bg-brand-bg hover:border-brand-sage transition-colors"
              >
                <f.icon className="w-6 h-6 text-brand-primary mb-3" />
                <h3 className="font-heading font-bold text-brand-text">{f.title}</h3>
                <p className="text-sm text-brand-text-secondary mt-1.5 leading-snug">{f.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-text tracking-tight">
          People are already losing their minds.
        </h2>
        <blockquote className="mt-10">
          <p className="text-xl sm:text-2xl text-brand-text font-medium leading-relaxed">
            &ldquo;I shared it with growers and they said they&apos;ve never seen
            anything like it.&rdquo;
          </p>
          <footer className="text-sm text-brand-text-secondary mt-4">PlantPal grower</footer>
        </blockquote>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="bg-brand-primary rounded-3xl p-10 sm:p-16 text-white text-center">
          <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight">
            Your plants are counting on you.
          </h2>
          <p className="text-brand-sage text-lg mt-5 max-w-md mx-auto leading-relaxed">
            Start with one photo. PlantPal handles the rest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link href="/onboarding">
              <Button
                variant="secondary"
                size="lg"
                className="min-w-[200px] h-14 bg-white text-brand-primary hover:bg-brand-bg text-base"
              >
                Get Started Free
              </Button>
            </Link>
            <Link href="/waitlist">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px] h-14 border-white/40 text-white hover:bg-white/10 text-base"
              >
                Join Waitlist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Email capture */}
      <WaitlistCta
        heading="Get early access before your fiddle leaf gives up."
        source="homepage"
        className="pb-20 sm:pb-28"
      />
    </>
  );
}

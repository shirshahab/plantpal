import type { Metadata } from "next";
import Image from "next/image";
import {
  Bell,
  CloudSun,
  Download,
  Flower2,
  GraduationCap,
  ScanLine,
  Stethoscope,
} from "lucide-react";
import { PlantPalIconTile, PlantPalLogo } from "@/components/brand/plantpal-logo";
import { OFFICIAL_APP_ICON } from "@/lib/brand/tokens";
import { absoluteUrl, SOCIAL_LINKS } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Brand Kit",
  description:
    "The official PlantPal brand kit. Logo, colors, typography, voice, mascot, and usage rules.",
  alternates: { canonical: absoluteUrl("/brand") },
  openGraph: {
    title: "PlantPal Brand Kit",
    description:
      "The official PlantPal brand kit. Logo, colors, typography, voice, mascot, and usage rules.",
    url: absoluteUrl("/brand"),
  },
};

const TOC = [
  { id: "foundation", label: "Foundation" },
  { id: "logo", label: "Logo" },
  { id: "color", label: "Color" },
  { id: "typography", label: "Typography" },
  { id: "voice", label: "Voice & Tone" },
  { id: "messaging", label: "Messaging" },
  { id: "iconography", label: "Iconography" },
  { id: "photography", label: "Photography" },
  { id: "illustration", label: "Illustration" },
  { id: "mascot", label: "Planty" },
  { id: "social", label: "Social" },
  { id: "app-store", label: "App Store" },
  { id: "downloads", label: "Downloads" },
];

const COLORS = [
  {
    name: "Primary Green",
    hex: "#2D6A4F",
    rgb: "45, 106, 79",
    usage: "Logo, primary buttons, headers, key actions. The backbone of the brand.",
    textClass: "text-white",
  },
  {
    name: "Secondary Green",
    hex: "#74C365",
    rgb: "116, 195, 101",
    usage: "Growth accents, success states, progress bars, healthy-plant signals.",
    textClass: "text-white",
  },
  {
    name: "Soft Green",
    hex: "#95B89B",
    rgb: "149, 184, 155",
    usage: "Borders, dividers, subtle backgrounds, secondary UI surfaces.",
    textClass: "text-white",
  },
  {
    name: "Background",
    hex: "#FAFBF8",
    rgb: "250, 251, 248",
    usage: "Page backgrounds. Warm, calm, and never sterile white.",
    textClass: "text-gray-900",
    border: true,
  },
  {
    name: "Text",
    hex: "#111827",
    rgb: "17, 24, 39",
    usage: "Headlines and body copy. High contrast, easy reading.",
    textClass: "text-white",
  },
];

const VOICE_DO = [
  "Plants are dramatic.",
  "Yellow leaves are a cry for help.",
  "Let's figure out what's wrong.",
  "Your plant isn't dead. Yet.",
  "Water it less. Seriously.",
];

const VOICE_DONT = [
  "Leverage our AI-powered ecosystem.",
  "Unlock revolutionary plant insights.",
  "A seamless horticultural experience.",
  "Empowering plant parents at scale.",
  "Best-in-class botanical solutions.",
];

const PERSONALITY = [
  "Friendly",
  "Helpful",
  "Confident",
  "Slightly rebellious",
  "Funny",
  "Encouraging",
  "Smart",
];

const ICON_EXAMPLES = [
  { icon: ScanLine, label: "Scanner" },
  { icon: Stethoscope, label: "Plant Doctor" },
  { icon: GraduationCap, label: "Academy" },
  { icon: CloudSun, label: "Weather" },
  { icon: Flower2, label: "Garden" },
  { icon: Bell, label: "Notifications" },
];

const DOWNLOADS = [
  { label: "Logo Pack", detail: "PNG + SVG, all variants" },
  { label: "App Icons", detail: "iOS, Android, favicon" },
  { label: "Brand Kit PDF", detail: "This page, printable" },
  { label: "Social Assets", detail: "Templates and avatars" },
];

function SectionHeading({
  number,
  id,
  title,
  subtitle,
}: {
  number: string;
  id: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 mb-10">
      <p className="font-heading text-sm font-bold text-brand-growth tracking-widest">
        {number}
      </p>
      <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-text tracking-tight mt-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-brand-text-secondary mt-3 max-w-xl leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

type PlantyMood = "happy" | "thinking" | "celebrating" | "warning";

/** Planty mascot face in four official moods. */
function PlantyFace({ mood }: { mood: PlantyMood }) {
  return (
    <svg viewBox="0 0 40 40" className="w-16 h-16" fill="none" aria-hidden>
      <path
        d="M20 6C14 6 10 12 10 18c0 6 4 12 10 16 6-4 10-10 10-16 0-6-4-12-10-12z"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 34V22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {mood === "thinking" ? (
        <>
          <path d="M14.5 16.5l3 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="24" cy="17" r="1.5" fill="white" />
          <path d="M17 22.5h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="30" cy="10" r="1.2" fill="white" />
          <circle cx="33" cy="7" r="0.8" fill="white" />
        </>
      ) : mood === "warning" ? (
        <>
          <circle cx="16" cy="17" r="1.5" fill="white" />
          <circle cx="24" cy="17" r="1.5" fill="white" />
          <path d="M16.5 23q3.5-2.5 7 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M31 6v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="31" cy="13" r="1.1" fill="white" />
        </>
      ) : mood === "celebrating" ? (
        <>
          <path d="M14 17.5q2-2.5 4 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M22 17.5q2-2.5 4 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M15.5 21q4.5 4.5 9 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="7" cy="9" r="1" fill="white" />
          <circle cx="33" cy="11" r="1" fill="white" />
          <circle cx="30" cy="5" r="0.8" fill="white" />
        </>
      ) : (
        <>
          <circle cx="16" cy="17" r="1.5" fill="white" />
          <circle cx="24" cy="17" r="1.5" fill="white" />
          <path d="M16 22q4 3 8 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

const PLANTY_MOODS: { mood: PlantyMood; name: string; when: string; line: string }[] = [
  {
    mood: "happy",
    name: "Happy Planty",
    when: "Default state. Greetings, tips, daily check-ins.",
    line: "Your pothos looks great today.",
  },
  {
    mood: "thinking",
    name: "Thinking Planty",
    when: "Diagnosis in progress, loading states, quiz questions.",
    line: "Hmm. Those spots look familiar.",
  },
  {
    mood: "celebrating",
    name: "Celebrating Planty",
    when: "Streaks, badges, recovered plants, completed lessons.",
    line: "Seven day streak. Your plants noticed.",
  },
  {
    mood: "warning",
    name: "Warning Planty",
    when: "Frost alerts, pest risks, overdue watering. Calm, never scary.",
    line: "Frost tonight. Your citrus would like a blanket.",
  },
];

export default function BrandPage() {
  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="bg-brand-primary text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="flex items-center gap-3 mb-8">
            <PlantPalIconTile size={56} className="rounded-2xl shadow-lg" />
            <span className="font-heading text-xl font-semibold">PlantPal</span>
          </div>
          <h1 className="font-heading text-5xl sm:text-7xl font-bold tracking-tight leading-[1.02] max-w-3xl">
            The PlantPal Brand Kit.
          </h1>
          <p className="text-brand-sage text-lg sm:text-xl mt-6 max-w-xl leading-relaxed">
            The official source of truth for everything PlantPal. Marketing, app screens,
            social, partnerships, and merch all start here.
          </p>
        </div>
      </section>

      {/* TOC */}
      <nav
        aria-label="Brand kit sections"
        className="sticky top-[65px] z-40 bg-brand-bg/95 backdrop-blur border-b border-brand-sage/20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex gap-x-5 gap-y-1 overflow-x-auto whitespace-nowrap text-sm">
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-brand-text-secondary hover:text-brand-primary font-medium transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* 1. Foundation */}
        <section className="pt-20">
          <SectionHeading number="01" id="foundation" title="Brand Foundation" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl border border-brand-sage/25 p-8">
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                Name
              </p>
              <p className="font-heading text-3xl font-bold text-brand-text mt-2">PlantPal</p>
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mt-8">
                Tagline
              </p>
              <p className="font-heading text-2xl font-bold text-brand-primary mt-2">
                Grow with confidence.
              </p>
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mt-8">
                Mission
              </p>
              <p className="text-brand-text mt-2 leading-relaxed">
                Help people stop killing plants and start enjoying gardening.
              </p>
            </div>
            <div className="bg-white rounded-3xl border border-brand-sage/25 p-8">
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                Personality
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {PERSONALITY.map((trait) => (
                  <span
                    key={trait}
                    className="px-3 py-1.5 rounded-full bg-brand-sage/15 text-brand-primary text-sm font-medium"
                  >
                    {trait}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {["Not corporate", "Not scientific jargon"].map((trait) => (
                  <span
                    key={trait}
                    className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-medium line-through decoration-red-300"
                  >
                    {trait}
                  </span>
                ))}
              </div>
              <div className="mt-8 bg-brand-bg rounded-2xl p-5 border border-brand-sage/20">
                <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                  Think
                </p>
                <p className="font-heading text-lg font-bold text-brand-text mt-1">
                  Liquid Death meets Duolingo, for plants.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Logo */}
        <section className="pt-20">
          <SectionHeading
            number="02"
            id="logo"
            title="Logo System"
            subtitle="The Living P. One mark, used consistently, everywhere. Always use the official PNG asset. Never redraw it."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-3xl border border-brand-sage/25 p-8 flex flex-col items-center justify-center min-h-44">
              <PlantPalLogo size="lg" />
              <p className="text-xs text-brand-text-secondary mt-6">Primary · full color</p>
            </div>
            <div className="bg-brand-primary rounded-3xl p-8 flex flex-col items-center justify-center min-h-44">
              <span className="inline-flex items-center gap-2.5">
                <PlantPalIconTile size={44} />
                <span className="font-heading text-xl font-semibold text-white tracking-tight">
                  PlantPal
                </span>
              </span>
              <p className="text-xs text-brand-sage mt-6">Secondary · on brand green</p>
            </div>
            <div className="bg-gray-900 rounded-3xl p-8 flex flex-col items-center justify-center min-h-44">
              <span className="inline-flex items-center gap-2.5">
                <PlantPalIconTile size={44} />
                <span className="font-heading text-xl font-semibold text-white tracking-tight">
                  PlantPal
                </span>
              </span>
              <p className="text-xs text-gray-400 mt-6">Dark version</p>
            </div>
            <div className="bg-white rounded-3xl border border-brand-sage/25 p-8 flex flex-col items-center justify-center min-h-44">
              <PlantPalIconTile size={64} className="rounded-2xl" />
              <p className="text-xs text-brand-text-secondary mt-6">Icon only · app icon</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <div className="bg-white rounded-3xl border border-brand-sage/25 p-8">
              <h3 className="font-heading font-bold text-brand-text">Clear space and size</h3>
              <ul className="mt-4 space-y-3 text-sm text-brand-text-secondary leading-relaxed">
                <li className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-growth mt-2 shrink-0" />
                  Keep clear space around the logo equal to the height of the icon tile.
                  Nothing crowds the mark.
                </li>
                <li className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-growth mt-2 shrink-0" />
                  Minimum icon size: 24px digital, 10mm print.
                </li>
                <li className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-growth mt-2 shrink-0" />
                  Minimum full logo width: 100px. Below that, use the icon alone.
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-3xl border border-brand-sage/25 p-8">
              <h3 className="font-heading font-bold text-brand-text">Never do this</h3>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-2xl bg-brand-bg border border-red-200 p-4 flex flex-col items-center">
                  <Image
                    src={OFFICIAL_APP_ICON}
                    alt="Stretched logo example"
                    width={40}
                    height={40}
                    className="scale-x-150 opacity-90"
                  />
                  <p className="text-[11px] text-red-500 font-medium mt-3 text-center">
                    Don&apos;t stretch
                  </p>
                </div>
                <div className="rounded-2xl bg-brand-bg border border-red-200 p-4 flex flex-col items-center">
                  <Image
                    src={OFFICIAL_APP_ICON}
                    alt="Recolored logo example"
                    width={40}
                    height={40}
                    className="hue-rotate-180 opacity-90"
                  />
                  <p className="text-[11px] text-red-500 font-medium mt-3 text-center">
                    Don&apos;t recolor
                  </p>
                </div>
                <div className="rounded-2xl bg-brand-bg border border-red-200 p-4 flex flex-col items-center">
                  <Image
                    src={OFFICIAL_APP_ICON}
                    alt="Rotated logo example"
                    width={40}
                    height={40}
                    className="rotate-12 drop-shadow-lg opacity-90"
                  />
                  <p className="text-[11px] text-red-500 font-medium mt-3 text-center">
                    No tilt, no shadows
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Color */}
        <section className="pt-20">
          <SectionHeading
            number="03"
            id="color"
            title="Color System"
            subtitle="Greens do the talking. Everything else stays out of the way."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {COLORS.map((color) => (
              <div
                key={color.hex}
                className={cn(
                  "rounded-3xl overflow-hidden border",
                  color.border ? "border-brand-sage/40" : "border-transparent"
                )}
              >
                <div
                  className={cn("h-36 p-5 flex flex-col justify-end", color.textClass)}
                  style={{ backgroundColor: color.hex }}
                >
                  <p className="font-heading font-bold">{color.name}</p>
                </div>
                <div className="bg-white border-t border-brand-sage/20 p-5">
                  <p className="font-mono text-sm font-semibold text-brand-text">{color.hex}</p>
                  <p className="font-mono text-xs text-brand-text-secondary mt-1">
                    RGB {color.rgb}
                  </p>
                  <p className="text-xs text-brand-text-secondary mt-3 leading-relaxed">
                    {color.usage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Typography */}
        <section className="pt-20">
          <SectionHeading
            number="04"
            id="typography"
            title="Typography"
            subtitle="Plus Jakarta Sans for headings. Inter for body. Both free, both everywhere."
          />
          <div className="bg-white rounded-3xl border border-brand-sage/25 p-8 sm:p-12 space-y-10">
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-2">
                H1 · Plus Jakarta Sans Bold · 56-72px
              </p>
              <p className="font-heading text-5xl sm:text-6xl font-bold text-brand-text tracking-tight">
                Stop killing your plants.
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-2">
                H2 · Plus Jakarta Sans Bold · 32-40px
              </p>
              <p className="font-heading text-4xl font-bold text-brand-text tracking-tight">
                Plants are dramatic.
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-2">
                H3 · Plus Jakarta Sans Bold · 20-24px
              </p>
              <p className="font-heading text-2xl font-bold text-brand-text tracking-tight">
                Your plant coach in your pocket.
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-2">
                Body · Inter Regular · 16-18px
              </p>
              <p className="text-lg text-brand-text-secondary leading-relaxed max-w-2xl">
                PlantPal tells you what your plants are, what&apos;s wrong with them, and
                what to do next. Snap a photo, get an answer, water accordingly.
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-2">
                Caption · Inter Medium · 12-14px
              </p>
              <p className="text-sm font-medium text-brand-text-secondary">
                No green thumb required.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Voice & Tone */}
        <section className="pt-20">
          <SectionHeading
            number="05"
            id="voice"
            title="Voice & Tone"
            subtitle="PlantPal speaks like a knowledgeable friend. Short sentences. No fluff. No corporate language. No startup buzzwords. No em dashes."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl border-2 border-brand-growth/40 p-8">
              <p className="font-heading font-bold text-brand-primary text-sm uppercase tracking-wide">
                Do
              </p>
              <ul className="mt-4 space-y-3">
                {VOICE_DO.map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="text-brand-growth font-bold mt-0.5">✓</span>
                    <span className="font-heading font-semibold text-brand-text">
                      &ldquo;{line}&rdquo;
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-3xl border-2 border-red-200 p-8">
              <p className="font-heading font-bold text-red-500 text-sm uppercase tracking-wide">
                Don&apos;t
              </p>
              <ul className="mt-4 space-y-3">
                {VOICE_DONT.map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="text-red-400 font-bold mt-0.5">✕</span>
                    <span className="text-brand-text-secondary line-through decoration-red-300">
                      &ldquo;{line}&rdquo;
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 6. Messaging */}
        <section className="pt-20">
          <SectionHeading number="06" id="messaging" title="Brand Messaging" />
          <div className="bg-brand-primary rounded-3xl p-10 sm:p-14 text-center">
            <p className="text-xs font-semibold text-brand-sage uppercase tracking-wide">
              Primary headline
            </p>
            <p className="font-heading text-4xl sm:text-6xl font-bold text-white tracking-tight mt-3">
              Stop killing your plants.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
            {[
              "Your plant coach in your pocket.",
              "Plants are hard. PlantPal helps.",
              "Grow with confidence.",
            ].map((headline) => (
              <div
                key={headline}
                className="bg-white rounded-3xl border border-brand-sage/25 p-7 text-center"
              >
                <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                  Alternative
                </p>
                <p className="font-heading text-xl font-bold text-brand-text mt-2">{headline}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-3xl border border-brand-sage/25 p-8 mt-5 text-center">
            <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
              Core message
            </p>
            <p className="text-lg text-brand-text mt-3 max-w-2xl mx-auto leading-relaxed">
              PlantPal tells you what your plants are, what&apos;s wrong with them, and
              what to do next.
            </p>
          </div>
        </section>

        {/* 7. Iconography */}
        <section className="pt-20">
          <SectionHeading
            number="07"
            id="iconography"
            title="Iconography"
            subtitle="Rounded, friendly, simple. Consistent 2px stroke. Lucide icon set, primary green on soft green tiles."
          />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {ICON_EXAMPLES.map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-2xl border border-brand-sage/25 p-5 flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-sage/15 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-brand-primary" strokeWidth={2} />
                </div>
                <p className="text-xs font-medium text-brand-text mt-3 text-center">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Photography */}
        <section className="pt-20">
          <SectionHeading
            number="08"
            id="photography"
            title="Photography Style"
            subtitle="Real plants, real light, real progress. If it looks like a stock photo, it is one. Don't use it."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl border-2 border-brand-growth/40 p-8">
              <p className="font-heading font-bold text-brand-primary text-sm uppercase tracking-wide">
                Use
              </p>
              <ul className="mt-4 space-y-3 text-brand-text">
                {[
                  "Real plants, flaws included",
                  "Natural lighting",
                  "Warm colors",
                  "Healthy gardens",
                  "Progress photos: before, during, after",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-brand-growth font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-3xl border-2 border-red-200 p-8">
              <p className="font-heading font-bold text-red-500 text-sm uppercase tracking-wide">
                Avoid
              </p>
              <ul className="mt-4 space-y-3 text-brand-text-secondary">
                {[
                  "Stock business people pointing at plants",
                  "Corporate imagery",
                  "Futuristic sci-fi imagery",
                  "Generic tech graphics",
                  "Anything with a glowing circuit board",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-red-400 font-bold mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 9. Illustration */}
        <section className="pt-20">
          <SectionHeading
            number="09"
            id="illustration"
            title="Illustration Style"
            subtitle="Bright, friendly, Nintendo-quality polish. Slightly playful, always garden focused."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                title: "Planty mascot",
                copy: "The face of PlantPal. Expressive, simple shapes, white linework on brand green.",
              },
              {
                title: "Plant illustrations",
                copy: "Rounded leaves, soft shading, recognizable species. Cute but botanically honest.",
              },
              {
                title: "Garden graphics",
                copy: "Beds, pots, and yards drawn warm and inviting. The garden you wish you had.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-3xl border border-brand-sage/25 p-7">
                <h3 className="font-heading font-bold text-brand-text">{item.title}</h3>
                <p className="text-sm text-brand-text-secondary mt-2 leading-relaxed">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 10. Mascot */}
        <section className="pt-20">
          <SectionHeading
            number="10"
            id="mascot"
            title="Planty"
            subtitle="Plant guide and coach. Helpful, funny, encouraging. Never annoying. Planty shows up to help, then gets out of the way."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANTY_MOODS.map((item) => (
              <div
                key={item.mood}
                className="bg-white rounded-3xl border border-brand-sage/25 overflow-hidden"
              >
                <div className="bg-brand-primary p-8 flex items-center justify-center">
                  <PlantyFace mood={item.mood} />
                </div>
                <div className="p-6">
                  <h3 className="font-heading font-bold text-brand-text">{item.name}</h3>
                  <p className="text-xs text-brand-text-secondary mt-2 leading-relaxed">
                    {item.when}
                  </p>
                  <p className="text-sm text-brand-text mt-3 italic">&ldquo;{item.line}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 11. Social */}
        <section className="pt-20">
          <SectionHeading
            number="11"
            id="social"
            title="Social Media"
            subtitle="Funny. Helpful. Direct. If a post sounds like a press release, delete it."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-3xl border border-brand-sage/25 p-7 hover:border-brand-sage hover:shadow-md transition-all"
              >
                <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                  {social.label}
                </p>
                <p className="font-heading text-xl font-bold text-brand-primary mt-2">
                  {social.handle}
                </p>
              </a>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <div className="bg-white rounded-3xl border-2 border-red-200 p-7">
              <p className="font-heading font-bold text-red-500 text-sm uppercase tracking-wide">
                Bad post
              </p>
              <p className="text-brand-text-secondary mt-3 line-through decoration-red-300">
                &ldquo;Today&apos;s horticultural recommendation...&rdquo;
              </p>
            </div>
            <div className="bg-white rounded-3xl border-2 border-brand-growth/40 p-7">
              <p className="font-heading font-bold text-brand-primary text-sm uppercase tracking-wide">
                Good post
              </p>
              <p className="font-heading font-semibold text-brand-text mt-3">
                &ldquo;Your plant isn&apos;t dead. Yet.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* 12. App Store */}
        <section className="pt-20">
          <SectionHeading
            number="12"
            id="app-store"
            title="App Store"
            subtitle="The listing sells the same story as the website. Same headline, same voice."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl border border-brand-sage/25 p-8">
              <div className="flex items-center gap-4">
                <PlantPalIconTile size={72} className="rounded-2xl shadow-md" />
                <div>
                  <p className="font-heading font-bold text-brand-text text-lg">PlantPal</p>
                  <p className="text-sm text-brand-text-secondary">Grow with confidence.</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mt-8">
                Primary headline
              </p>
              <p className="font-heading text-2xl font-bold text-brand-text mt-2">
                Stop killing your plants.
              </p>
            </div>
            <div className="bg-white rounded-3xl border border-brand-sage/25 p-8">
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                Screenshot order
              </p>
              <ol className="mt-4 space-y-3 text-sm text-brand-text">
                {[
                  "Scanner identifying a plant",
                  "Plant Doctor diagnosing yellow leaves",
                  "Today's care plan",
                  "Local weather alert",
                  "Academy lesson with Planty",
                ].map((item, i) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="font-heading font-bold text-brand-growth">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-brand-text-secondary mt-6 leading-relaxed">
                Every screenshot gets one short headline in Plus Jakarta Sans Bold on brand
                green or background cream. No feature essays.
              </p>
            </div>
          </div>
        </section>

        {/* 13. Downloads */}
        <section className="pt-20">
          <SectionHeading
            number="13"
            id="downloads"
            title="Downloads"
            subtitle="Asset packs are being prepared. Until then, this page is the source of truth."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DOWNLOADS.map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-3xl border border-brand-sage/25 border-dashed p-7 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-sage/15 flex items-center justify-center mx-auto">
                  <Download className="w-5 h-5 text-brand-primary" />
                </div>
                <h3 className="font-heading font-bold text-brand-text mt-4">{item.label}</h3>
                <p className="text-xs text-brand-text-secondary mt-1">{item.detail}</p>
                <span className="inline-block mt-4 text-xs font-semibold text-brand-text-secondary bg-brand-bg border border-brand-sage/25 rounded-full px-3 py-1.5">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-brand-text-secondary mt-8 text-center">
            Need an asset now? Email{" "}
            <a href="mailto:support@plantpal.app" className="text-brand-primary hover:underline">
              support@plantpal.app
            </a>{" "}
            with the subject &ldquo;Brand assets&rdquo;.
          </p>
        </section>
      </div>
    </div>
  );
}

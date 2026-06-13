import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SocialLinks } from "@/components/marketing/social-links";
import { WaitlistCta } from "@/components/marketing/waitlist-cta";
import { absoluteUrl } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "About",
  description: "PlantPal exists because plant care is way too confusing.",
  alternates: { canonical: absoluteUrl("/about") },
  openGraph: {
    title: "About PlantPal",
    description: "PlantPal exists because plant care is way too confusing.",
    url: absoluteUrl("/about"),
  },
};

export default function AboutPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-brand-text tracking-tight leading-[1.05]">
          Built because plant care is way too confusing.
        </h1>

        <div className="mt-10 space-y-5 text-lg text-brand-text-secondary leading-relaxed">
          <p>
            Most plant advice is either too vague or too scientific. PlantPal makes it
            simple. Snap a photo. Get answers. Grow better.
          </p>
          <p>
            No jargon. No 40-page care guides. Just what your plant needs, when it needs
            it, based on where you actually live.
          </p>
        </div>

        <blockquote className="mt-12 bg-white rounded-3xl border border-brand-sage/25 p-8">
          <p className="text-xl text-brand-text font-medium leading-relaxed">
            &ldquo;I shared it with growers and they said they&apos;ve never seen
            anything like it.&rdquo;
          </p>
          <footer className="text-sm text-brand-text-secondary mt-3">Early PlantPal user</footer>
        </blockquote>

        <div className="mt-12 flex flex-col sm:flex-row gap-3">
          <Link href="/onboarding">
            <Button size="lg" className="min-w-[180px] h-14 text-base">
              Get Started Free
            </Button>
          </Link>
          <Link href="/features">
            <Button variant="outline" size="lg" className="min-w-[180px] h-14 text-base">
              See Features
            </Button>
          </Link>
        </div>

        <div className="mt-12">
          <p className="text-sm font-medium text-brand-text mb-3">
            Follow along for plant tips and product updates.
          </p>
          <SocialLinks showHandles />
        </div>
      </div>

      <WaitlistCta source="about" className="mt-20" />
    </div>
  );
}

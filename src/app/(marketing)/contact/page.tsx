import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialLinks } from "@/components/marketing/social-links";
import { absoluteUrl, SUPPORT_EMAIL } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Got plants? Got feedback? Got a garden emergency? Talk to us.",
  alternates: { canonical: absoluteUrl("/contact") },
  openGraph: {
    title: "Contact PlantPal",
    description: "Got plants? Got feedback? Got a garden emergency? Talk to us.",
    url: absoluteUrl("/contact"),
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="font-heading text-4xl sm:text-6xl font-bold text-brand-text tracking-tight leading-[1.05]">
        Talk to us.
      </h1>
      <p className="text-lg text-brand-text-secondary mt-5 leading-relaxed">
        Got plants? Got feedback? Got a garden emergency? Talk to us.
      </p>

      <div className="mt-12 space-y-4">
        <div className="bg-white rounded-2xl border border-brand-sage/25 p-6 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-sage/15 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-brand-text">Email support</h2>
            <p className="text-sm text-brand-text-secondary mt-1">
              For account issues, questions, and plant emergencies.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-sm font-medium text-brand-primary hover:underline mt-2 inline-block"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-sage/25 p-6 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-sage/15 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-brand-text">Beta feedback</h2>
            <p className="text-sm text-brand-text-secondary mt-1">
              Found a bug? Have an idea? We read every single note.
            </p>
            <Link href="/support" className="inline-block mt-3">
              <Button size="sm" variant="outline">
                Send Feedback
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-sage/25 p-6 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-sage/15 flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-brand-text">Partnerships</h2>
            <p className="text-sm text-brand-text-secondary mt-1">
              Nurseries, growers, garden centers, and creators. Let&apos;s talk.
            </p>
            <Link href="/partners" className="inline-block mt-3">
              <Button size="sm" variant="outline">
                Partner With Us
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <p className="text-sm font-medium text-brand-text mb-3">Or find us where you scroll.</p>
        <SocialLinks showHandles />
      </div>
    </div>
  );
}

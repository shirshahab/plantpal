"use client";

import Link from "next/link";
import {
  Leaf,
  ScanLine,
  ListTodo,
  GraduationCap,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SendFeedbackButton } from "@/components/feedback/send-feedback-button";
import { AiSafetyDisclaimer } from "@/components/ai/ai-safety-disclaimer";

const STEPS = [
  {
    step: 1,
    icon: Leaf,
    title: "Add one real plant",
    body: "Go to Add Plant, scan or search for a plant you actually own, pick a goal, and save it.",
    href: "/plants/new",
    cta: "Add a plant",
  },
  {
    step: 2,
    icon: ScanLine,
    title: "Scan one plant",
    body: "Open the Scanner, take a clear photo, and review the identification. Try “Add to My Garden” if it looks right.",
    href: "/scanner",
    cta: "Open scanner",
  },
  {
    step: 3,
    icon: ListTodo,
    title: "Complete one task",
    body: "Check Dashboard or Today for watering or care tasks. Mark one as done.",
    href: "/today",
    cta: "View tasks",
  },
  {
    step: 4,
    icon: GraduationCap,
    title: "Try one lesson",
    body: "Open Academy, pick any lesson, and finish it. Lessons are short, about 2 to 3 minutes.",
    href: "/academy",
    cta: "Open Academy",
  },
  {
    step: 5,
    icon: MessageSquare,
    title: "Send feedback",
    body: "Tell us what worked, what broke, or what confused you. Use the button below or “Send Feedback” anywhere in the app.",
    href: null,
    cta: null,
  },
];

export default function TesterGuidePage() {
  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <PageHeader
        title="Tester guide"
        description="Complete these 5 steps. Takes about 15 minutes."
      />

      <AiSafetyDisclaimer />

      <div className="space-y-4">
        {STEPS.map(({ step, icon: Icon, title, body, href, cta }) => (
          <Card key={step} padding="md" className="relative overflow-hidden">
            <div className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                  {step}
                </div>
                {step < STEPS.length && (
                  <div className="w-0.5 flex-1 bg-green-100 mt-2 min-h-[24px]" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-green-600" />
                  <h2 className="font-semibold text-gray-900">{title}</h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                {href && cta && (
                  <Link href={href} className="inline-block mt-3">
                    <Button variant="outline" size="sm" className="touch-manipulation">
                      {cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
                {step === 5 && (
                  <div className="mt-3">
                    <SendFeedbackButton />
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="md" className="bg-green-50/50 border-green-100">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">When you&apos;re done</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              You&apos;ve helped us more than you know. Come back anytime for new features and
              fixes.
            </p>
            <Link href="/onboarding" className="inline-block mt-3">
              <Button size="sm" variant="secondary" className="touch-manipulation">
                Back to onboarding
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

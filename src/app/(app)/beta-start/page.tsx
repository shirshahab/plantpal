"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Leaf,
  ScanLine,
  ListTodo,
  GraduationCap,
  AlertCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BetaBadge } from "@/components/brand/beta-badge";

const WHAT_TO_TEST = [
  { icon: Leaf, text: "Add a plant — scan, search, or type it in" },
  { icon: ScanLine, text: "Scan a plant with your camera" },
  { icon: ListTodo, text: "Complete a task from Today or Dashboard" },
  { icon: GraduationCap, text: "Finish one Academy lesson" },
];

const KNOWN_ISSUES = [
  "Some features keep data on this device until cloud sync is fully wired",
  "All Pro features are unlocked for free during the beta",
  "Scan and diagnosis results are guidance only — always verify with your own judgment",
];

export default function BetaStartPage() {
  const router = useRouter();

  function startScan() {
    router.push("/scanner");
  }

  function startOwnPlants() {
    router.push("/plants/new");
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <PageHeader
        title="Welcome to PlantPal Beta"
        description="Thanks for helping us test before launch."
        action={<BetaBadge />}
      />

      <Card padding="md" className="border-green-100 bg-gradient-to-br from-green-50/80 to-white">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">You&apos;re one of our first testers</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              Explore the app, try real workflows, and tell us what breaks or confuses you.
              There are no wrong answers — honest feedback is the goal.
            </p>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
          What to test
        </h2>
        <Card padding="none" className="divide-y divide-gray-50">
          {WHAT_TO_TEST.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-800">{text}</p>
            </div>
          ))}
        </Card>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          Known issues
        </h2>
        <Card padding="md" className="bg-amber-50/50 border-amber-100">
          <ul className="space-y-2 text-sm text-amber-950/90">
            {KNOWN_ISSUES.map((issue) => (
              <li key={issue} className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Choose your path
        </h2>
        <Button
          size="lg"
          className="w-full h-14 touch-manipulation"
          onClick={startScan}
        >
          <ScanLine className="w-5 h-5" />
          Scan Your First Plant
        </Button>
        <p className="text-xs text-gray-500 text-center px-4">
          Point your camera at any plant for an instant identification.
        </p>
        <Button
          variant="secondary"
          size="lg"
          className="w-full h-14 touch-manipulation"
          onClick={startOwnPlants}
        >
          <Leaf className="w-5 h-5" />
          Add Plant Manually
        </Button>
        <p className="text-xs text-gray-500 text-center px-4">
          Search or type in your plants to start tasks and care plans.
        </p>
      </section>

      <div className="flex flex-col gap-2 pt-2">
        <Link href="/tester-guide">
          <Button variant="outline" className="w-full touch-manipulation">
            <BookOpen className="w-4 h-4" />
            Read tester guide
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" className="w-full touch-manipulation text-gray-500">
            Skip to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

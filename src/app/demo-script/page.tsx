"use client";

import Link from "next/link";
import {
  Leaf,
  ArrowRight,
  Play,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { seedDemoGarden } from "@/lib/demo/seed-demo-garden";
import { useRouter } from "next/navigation";

const DEMO_STEPS = [
  {
    num: 1,
    title: "Open dashboard",
    desc: "My Garden overview — score, local care, and top tasks.",
    href: "/dashboard",
    tip: "Point out the demo garden banner and Pasadena climate card.",
  },
  {
    num: 2,
    title: "Show Today tasks",
    desc: "Daily command center with watering, missions, and weather tasks.",
    href: "/today",
    tip: "Highlight overdue bougainvillea health check and heat-aware watering.",
  },
  {
    num: 3,
    title: "Open Meyer Lemon",
    desc: "Full plant profile with care schedule and journey.",
    href: "/plants/1",
    tip: "This is the hero plant — fruit set milestone in progress.",
  },
  {
    num: 4,
    title: "Generate AI care plan",
    desc: "Tap 'Generate AI Care Plan' on the lemon detail page.",
    href: "/plants/1",
    tip: "Demo already has a pre-loaded plan — or generate live with OpenAI key.",
  },
  {
    num: 5,
    title: "Local Pasadena care intelligence",
    desc: "Climate card shows zone 10a, heat alerts, and plant-specific advice.",
    href: "/dashboard",
    tip: "All demo plants use ZIP 91107 for consistent local data.",
  },
  {
    num: 6,
    title: "Scan yellow leaves",
    desc: "Open Plant Camera → Diagnose. Bougainvillea has a sample scan.",
    href: "/scanner",
    tip: "Or scan live — mention OpenAI Vision + optional Pl@ntNet backup.",
  },
  {
    num: 7,
    title: "Price check 3 gallon avocado",
    desc: "Price Checker → Avocado Tree, 3 gallon, ZIP 91107.",
    href: "/price-checker",
    tip: "Demo has a saved result: fair range $45–$85, Good Buy verdict.",
  },
  {
    num: 8,
    title: "Show Plant Journey",
    desc: "Meyer Lemon journey — goals, milestones, and active missions.",
    href: "/plants/1",
    tip: "Scroll to Journey section: 'First fruit set' milestone is active.",
  },
  {
    num: 9,
    title: "Show Learn section",
    desc: "Care lessons with progress and care level.",
    href: "/learn",
    tip: "Quick scroll through 2–3 lessons — mention gamified learning.",
  },
  {
    num: 10,
    title: "Close with value proposition",
    desc: "PlantPal = MyFitnessPal for plants. Track, diagnose, learn, act daily.",
    href: "/",
    tip: "End on landing page or offer to install PWA on their phone.",
  },
];

export default function DemoScriptPage() {
  const router = useRouter();

  function loadDemo() {
    seedDemoGarden("91107");
    router.push("/dashboard");
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-[#f8faf8]">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">Demo Script</span>
          </Link>
          <Button size="sm" onClick={loadDemo}>
            <Play className="w-4 h-4" />
            Load Demo
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live pitch guide</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            10-step demo flow for investors and user testing. Tap &quot;Load Demo&quot; first
            to seed the Pasadena garden with full data.
          </p>
        </div>

        <Card padding="md" className="bg-green-50 border-green-100">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Before you start</p>
              <p className="text-sm text-gray-600 mt-1">
                Load the demo garden, open on mobile if possible, and install as PWA
                to show the native feel.
              </p>
              <Button size="sm" className="mt-3" onClick={loadDemo}>
                Explore Demo Garden
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {DEMO_STEPS.map((step) => (
            <Link key={step.num} href={step.href}>
              <Card
                padding="md"
                className="hover:border-green-200 hover:bg-green-50/30 transition-colors group"
              >
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{step.title}</p>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 shrink-0" />
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{step.desc}</p>
                    <p className="text-xs text-green-700 mt-2 bg-green-50 rounded-lg px-2 py-1 inline-block">
                      💡 {step.tip}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Card padding="md" className="text-center space-y-3">
          <p className="font-semibold text-gray-900">Value proposition</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            PlantPal is the daily operating system for plant parents — combining tracking,
            AI vision, local climate intelligence, and education into one mobile-first app
            that tells you exactly what to do today.
          </p>
        </Card>
      </main>
    </div>
  );
}

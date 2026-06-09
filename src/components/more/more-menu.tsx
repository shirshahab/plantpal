"use client";

import Link from "next/link";
import {
  Stethoscope,
  Database,
  Trophy,
  Images,
  Wheat,
  ShoppingBag,
  Home,
  Gem,
  Users,
  Scan,
  Settings,
  ChevronRight,
  Sparkles,
  Tag,
  GraduationCap,
  CalendarDays,
  Trees,
  ClipboardList,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

const sections = [
  {
    title: "Daily Care",
    items: [
      { href: "/today", label: "Today", icon: Sparkles, desc: "Your daily command center" },
      { href: "/calendar", label: "Calendar", icon: CalendarDays, desc: "Monthly care schedule" },
      { href: "/learn", label: "Learn", icon: GraduationCap, desc: "Plant care lessons" },
    ],
  },
  {
    title: "Care & Tools",
    items: [
      { href: "/doctor", label: "Plant Doctor", icon: Stethoscope, desc: "Conversational plant help" },
      { href: "/concierge", label: "Concierge", icon: ClipboardList, desc: "Guided recovery plans" },
      { href: "/scanner", label: "Plant Camera", icon: Scan, desc: "ID, diagnose, scan tags" },
      { href: "/scanner/history", label: "Scanner History", icon: Images, desc: "Past scans & diagnoses" },
      { href: "/database", label: "Plant Database", icon: Database, desc: "183+ species" },
      { href: "/price-checker", label: "Price Checker", icon: Tag, desc: "Is this plant fairly priced?" },
    ],
  },
  {
    title: "Track & Celebrate",
    items: [
      { href: "/achievements", label: "Achievements", icon: Trophy, desc: "Badges & milestones" },
      { href: "/gallery", label: "Before & After", icon: Images, desc: "Plant transformations" },
      { href: "/harvest", label: "Harvest Log", icon: Wheat, desc: "Track edible yields" },
      { href: "/collection", label: "Rare Collection", icon: Gem, desc: "Collector mode" },
    ],
  },
  {
    title: "Plan & Discover",
    items: [
      { href: "/shop-assistant", label: "Shop Assistant", icon: ShoppingBag, desc: "Find plants to buy" },
      { href: "/landscape-designer", label: "Landscape Designer", icon: Trees, desc: "AI yard plans & budgets" },
      { href: "/property", label: "Property Mode", icon: Home, desc: "Landscape management" },
      { href: "/community", label: "Community", icon: Users, desc: "Tips, stories & gardens" },
      { href: "/ar", label: "AR Garden", icon: Sparkles, desc: "Concept preview" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/upgrade", label: "Upgrade", icon: Sparkles, desc: "Plans & limits" },
      { href: "/settings", label: "Settings", icon: Settings, desc: "Profile & preferences" },
      { href: "/setup", label: "Setup checker", icon: Database, desc: "Supabase & API health" },
      { href: "/demo-script", label: "Demo Script", icon: Sparkles, desc: "Live pitch guide" },
      { href: "/qa", label: "QA Checklist", icon: Trophy, desc: "Manual test checklist" },
    ],
  },
];

export function MoreMenuPage() {
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader title="More" description="Tools, tracking, and upcoming features" />

      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">
            {section.title}
          </p>
          <Card padding="none" className="divide-y divide-gray-50 overflow-hidden">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-green-50/50 transition-colors touch-manipulation"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}

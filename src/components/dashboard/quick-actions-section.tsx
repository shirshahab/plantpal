"use client";

import Link from "next/link";
import {
  ScanLine,
  Plus,
  Droplets,
  Camera,
  Stethoscope,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const ACTIONS = [
  { href: "/scanner", label: "Scan Plant", icon: ScanLine, color: "bg-green-600 text-white" },
  { href: "/plants/new", label: "Add Plant", icon: Plus, color: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  { href: "/today", label: "Water Task", icon: Droplets, color: "bg-sky-50 text-sky-700 border border-sky-100" },
  { href: "/gallery", label: "Progress Photo", icon: Camera, color: "bg-violet-50 text-violet-700 border border-violet-100" },
  { href: "/doctor", label: "Plant Doctor", icon: Stethoscope, color: "bg-amber-50 text-amber-700 border border-amber-100" },
];

export function DashboardQuickActions() {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-3 px-0.5">Quick actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {ACTIONS.map((action) => (
          <Link key={action.href} href={action.href} className="touch-manipulation">
            <Card
              padding="md"
              className={`h-full flex flex-col items-center justify-center gap-2 text-center hover:shadow-md transition-shadow ${action.color}`}
            >
              <action.icon className="w-6 h-6" />
              <span className="text-xs font-semibold leading-tight">{action.label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

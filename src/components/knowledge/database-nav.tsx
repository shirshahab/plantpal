"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Layers, FlaskConical, Bug } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/database", label: "Plants", icon: Leaf, exact: true },
  { href: "/database/soils", label: "Soils", icon: Layers },
  { href: "/database/fertilizers", label: "Fertilizers", icon: FlaskConical },
  { href: "/database/pests", label: "Pests", icon: Bug },
];

export function DatabaseNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors touch-manipulation",
              active
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-100 hover:border-green-200 hover:text-green-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

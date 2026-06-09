"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf,
  Plus,
  ScanLine,
  LayoutGrid,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/dashboard", label: "Garden", icon: Leaf },
  { href: "/plants/new", label: "Add", icon: Plus, primary: true },
  { href: "/scanner", label: "Scan", icon: ScanLine },
  { href: "/more", label: "More", icon: LayoutGrid },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/today") {
      return pathname === "/today" || pathname.startsWith("/calendar");
    }
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/plants";
    }
    if (href === "/plants/new") return pathname === "/plants/new";
    if (href === "/more") {
      const moreRoutes = [
        "/more", "/doctor", "/database", "/achievements", "/gallery",
        "/harvest", "/shop-assistant", "/property", "/collection",
        "/community", "/ar", "/settings", "/price-checker", "/learn", "/academy",
        "/scanner/history", "/setup", "/demo-script", "/qa",
      ];
      return moreRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 safe-bottom">
      <div className="flex items-stretch justify-around max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const isAdd = tab.primary;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] touch-manipulation transition-colors",
                active && !isAdd && "text-green-600",
                !active && !isAdd && "text-gray-400",
                isAdd &&
                  "-mt-4 flex-none w-12 h-12 rounded-2xl bg-green-600 text-white shadow-lg shadow-green-600/30 flex items-center justify-center mx-0.5"
              )}
            >
              <tab.icon
                className={cn("shrink-0", isAdd ? "w-5 h-5" : "w-[18px] h-[18px]")}
                strokeWidth={active || isAdd ? 2.25 : 2}
              />
              {!isAdd && (
                <span className="text-[10px] font-medium leading-none truncate max-w-full px-0.5">
                  {tab.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

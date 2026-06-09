"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Leaf,
  Plus,
  ScanLine,
  Settings,
  LogOut,
  GraduationCap,
  LayoutGrid,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/store/auth-provider";
import { PlantPalLogo } from "@/components/brand/plantpal-logo";
import { BetaBadge } from "@/components/brand/beta-badge";
import { BRAND } from "@/lib/brand/tokens";

const navItems = [
  { href: "/dashboard", label: "Garden", icon: LayoutDashboard },
  { href: "/plants", label: "All Plants", icon: Leaf },
  { href: "/plants/new", label: "Add Plant", icon: Plus },
  { href: "/scanner", label: "Scanner", icon: ScanLine },
  { href: "/academy", label: "Academy", icon: GraduationCap },
  { href: "/more", label: "More", icon: LayoutGrid },
  { href: "/doctor", label: "Plant Doctor", icon: ScanLine },
  { href: "/database", label: "Database", icon: Leaf },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, isMockMode } = useAuth();

  async function handleLogout() {
    if (!isMockMode) await signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) => {
    if (href === "/plants/new") return pathname === "/plants/new";
    if (href === "/plants") {
      return (
        pathname === "/plants" ||
        (pathname.startsWith("/plants/") && pathname !== "/plants/new")
      );
    }
    if (href === "/academy") {
      return pathname === "/academy" || pathname.startsWith("/academy/");
    }
    if (href === "/more") {
      return (
        pathname === "/more" ||
        pathname.startsWith("/doctor") ||
        pathname.startsWith("/concierge") ||
        pathname.startsWith("/achievements") ||
        pathname.startsWith("/gallery") ||
        pathname.startsWith("/harvest") ||
        pathname.startsWith("/shop-assistant") ||
        pathname.startsWith("/landscape") ||
        pathname.startsWith("/landscape-designer") ||
        pathname.startsWith("/property") ||
        pathname.startsWith("/collection") ||
        pathname.startsWith("/community") ||
        pathname.startsWith("/ar")
      );
    }
    if (href === "/database") {
      return pathname === "/database" || pathname.startsWith("/database/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-100 flex flex-col">
      <div className="flex items-center gap-3 px-6 py-8">
        <PlantPalLogo size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-medium text-brand-primary leading-none">{BRAND.tagline}</p>
            <BetaBadge />
          </div>
          <p className="text-xs text-brand-text-secondary mt-1 truncate">Smart plant care coach</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  active ? "text-green-600" : "text-gray-400"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-brand-sage/15 hover:text-brand-primary transition-all duration-200 touch-manipulation"
        >
          <Globe className="w-5 h-5 text-brand-primary/70" />
          Back to Website
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full touch-manipulation"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}

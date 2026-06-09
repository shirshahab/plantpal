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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/store/auth-provider";

const navItems = [
  { href: "/dashboard", label: "Garden", icon: LayoutDashboard },
  { href: "/plants", label: "All Plants", icon: Leaf },
  { href: "/plants/new", label: "Add Plant", icon: Plus },
  { href: "/scanner", label: "Scanner", icon: ScanLine },
  { href: "/learn", label: "Learn", icon: GraduationCap },
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
    if (href === "/learn") {
      return pathname === "/learn" || pathname.startsWith("/learn/");
    }
    if (href === "/more") {
      return (
        pathname === "/more" ||
        pathname.startsWith("/doctor") ||
        pathname.startsWith("/achievements") ||
        pathname.startsWith("/gallery") ||
        pathname.startsWith("/harvest") ||
        pathname.startsWith("/shop-assistant") ||
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
        <div className="w-10 h-10 rounded-2xl bg-green-600 flex items-center justify-center shadow-sm shadow-green-600/20">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">PlantPal</h1>
          <p className="text-xs text-gray-500">Your plant companion</p>
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

      <div className="px-3 pb-6">
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

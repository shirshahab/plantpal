"use client";

import { isMockMode } from "@/lib/supabase/config";

export function MockModeBadge() {
  if (process.env.NODE_ENV !== "development") return null;
  if (!isMockMode()) return null;

  return (
    <div className="fixed bottom-28 md:bottom-4 right-4 z-50 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200 shadow-sm">
      Mock Mode
    </div>
  );
}

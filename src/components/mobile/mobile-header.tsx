"use client";

import { Leaf } from "lucide-react";

export function MobileHeader({ title }: { title?: string }) {
  return (
    <header className="md:hidden sticky top-0 z-40 bg-[#f8faf8]/95 backdrop-blur-lg border-b border-gray-100/80 safe-top">
      <div className="flex items-center gap-2 px-4 h-14">
        <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center shadow-sm">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-gray-900">
          {title ?? "PlantPal"}
        </span>
      </div>
    </header>
  );
}

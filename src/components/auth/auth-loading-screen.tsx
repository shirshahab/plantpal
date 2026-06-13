"use client";

import { PlantyAvatar } from "@/components/brand/planty";

export function AuthLoadingScreen({ message = "Checking your garden paperwork…" }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <PlantyAvatar variant="thinking" size={64} className="mb-4" />
      <p className="text-sm font-medium text-gray-700">{message}</p>
    </div>
  );
}

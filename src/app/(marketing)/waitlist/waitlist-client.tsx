"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

function WaitlistContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "waitlist-page";

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center mb-10">
        <p className="text-sm font-medium text-green-600 uppercase tracking-wide mb-3">
          {source === "beta" ? "Beta access" : "Early access"}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          {source === "beta" ? "Join the PlantPal beta" : "Join the PlantPal waitlist"}
        </h1>
        <p className="text-gray-500 mt-4 leading-relaxed">
          {source === "beta"
            ? "You're applying for early beta access. Tell us what you grow so we can tailor your experience."
            : "Be first to know when we launch. Tell us what you grow so we can tailor your experience."}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <WaitlistForm variant="full" source={source} />
      </div>
    </div>
  );
}

export function WaitlistPageClient() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading…</div>}>
      <WaitlistContent />
    </Suspense>
  );
}

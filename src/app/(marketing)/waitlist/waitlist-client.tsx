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
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.05]">
          Get in before your plants give up.
        </h1>
        <p className="text-lg text-gray-500 mt-5 leading-relaxed">
          Join the PlantPal beta and help shape the app that tells you what your plants
          need before they turn into expensive compost.
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

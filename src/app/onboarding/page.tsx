import { Suspense } from "react";
import OnboardingPageClient from "./onboarding-client";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>}>
      <OnboardingPageClient />
    </Suspense>
  );
}

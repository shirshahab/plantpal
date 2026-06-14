"use client";

import Link from "next/link";
import { useAuth } from "@/lib/store/auth-provider";
import { resolveOnboardingCompleteForUser } from "@/lib/auth/onboarding-state";
import { Card } from "@/components/ui/card";

/** Shown on dashboard when signed in but onboarding is not complete. */
export function OnboardingSetupBanner() {
  const { user, cloudOnboardingComplete, profileReady } = useAuth();

  if (!user || !profileReady) return null;

  const complete = resolveOnboardingCompleteForUser(user.id, cloudOnboardingComplete);
  if (complete) return null;

  return (
    <Card padding="md" className="mb-4 border-green-200 bg-green-50/80">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-semibold text-green-900">Finish setting up your garden</p>
          <p className="text-sm text-green-800/90 mt-0.5">
            A quick setup helps PlantPal tailor care advice to your climate and goals.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center rounded-xl bg-green-700 text-white text-sm font-medium px-4 py-2.5 hover:bg-green-800 shrink-0"
        >
          Continue setup
        </Link>
      </div>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Paywall } from "@/components/billing/paywall";
import { TrialBanner } from "@/components/billing/trial-banner";

export default function UpgradePageClient() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <PageHeader
        title="PlantPal Pro"
        description="Then keep growing with PlantPal Pro."
      />
      <TrialBanner />
      <Paywall showSecondaryLink={false} />
      <p className="text-center text-sm text-gray-500">
        <Link href="/dashboard" className="text-green-700 hover:underline">
          Back to my garden
        </Link>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PRO_FEATURE_HIGHLIGHTS } from "@/lib/billing/pricing";

export default function UpgradePageClient() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      <PageHeader
        title="PlantPal Pro coming soon."
        description="During public beta, everyone gets every feature. Free."
      />

      <Card padding="lg" className="text-center border-green-100 bg-gradient-to-b from-green-50/80 to-white">
        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mt-4">Everything is included</h2>
        <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
          There are no paywalls or limits right now. When PlantPal Pro launches, beta users
          will be the first to know.
        </p>
        <Link href="/dashboard" className="inline-block mt-5">
          <Button>Back to my garden</Button>
        </Link>
      </Card>

      <section>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 text-center">
          What you get today
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRO_FEATURE_HIGHLIGHTS.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700"
            >
              <Sparkles className="w-4 h-4 text-green-600 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

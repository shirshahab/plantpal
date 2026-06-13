"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PlantyAvatar } from "@/components/brand/planty";
import { plantyMoodToVariant } from "@/lib/copy/planty-messages-system";
import { ctaForGreeting, pickPlantyGreeting } from "@/lib/copy/planty-greetings";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { lookupZipRecord } from "@/lib/location/usda-zones";

export function PlantyGreetingCard() {
  const greeting = useMemo(() => {
    const zip = loadUserProfile().zipCode || "91107";
    const record = lookupZipRecord(zip);
    return pickPlantyGreeting(record.city, record.usdaZone);
  }, []);
  const cta = ctaForGreeting(greeting.cta);
  const variant = plantyMoodToVariant(greeting.mood);

  return (
    <Card padding="md" className="border-brand-sage/25 bg-gradient-to-br from-green-50/80 to-white">
      <div className="flex items-start gap-3">
        <PlantyAvatar variant={variant} size={52} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-primary mb-1">
            Planty says
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{greeting.text}</p>
          {cta && (
            <Link
              href={cta.href}
              className="inline-block mt-2 text-xs font-semibold text-green-700 hover:text-green-800"
            >
              {cta.label} →
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

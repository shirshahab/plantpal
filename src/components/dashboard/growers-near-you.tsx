"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getLocalAreaName,
  getLocalGrowerInsights,
} from "@/lib/dashboard/local-growers";

interface GrowersNearYouProps {
  zipCode: string;
}

/**
 * Anonymous local grower activity. Aggregate only, no personal data,
 * so it works even when the user has zero friends.
 */
export function GrowersNearYou({ zipCode }: GrowersNearYouProps) {
  const insights = useMemo(() => getLocalGrowerInsights(zipCode), [zipCode]);
  const area = useMemo(() => getLocalAreaName(zipCode), [zipCode]);

  if (insights.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Local Grower Pulse</h2>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {area} · anonymous local signals
          </p>
        </div>
      </div>
      <Card padding="md" className="space-y-2.5">
        {insights.map((insight) => (
          <p key={insight.text} className="text-sm text-gray-700 flex gap-2">
            <span aria-hidden>{insight.emoji}</span>
            <span>{insight.text}</span>
          </p>
        ))}
        <div className="pt-1 flex flex-wrap gap-x-4">
          <Link href="/community">
            <Button variant="ghost" size="sm" className="text-green-700 touch-manipulation px-0">
              Local community <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Link href="/community#challenges">
            <Button variant="ghost" size="sm" className="text-green-700 touch-manipulation px-0">
              Local challenges <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}

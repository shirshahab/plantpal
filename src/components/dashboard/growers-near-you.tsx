"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildGrowerPulse, getLocalAreaName } from "@/lib/local/grower-pulse";
import type { DashboardIntelligenceContext } from "@/lib/intelligence/dashboard-insights";
import type { LocalPlantInsight } from "@/lib/intelligence/source-types";

interface GrowersNearYouProps {
  zipCode: string;
  intelligence?: DashboardIntelligenceContext;
}

/**
 * Local Grower Pulse: weather, season, and F5Bot mention signals when stored.
 */
export function GrowersNearYou({ zipCode, intelligence }: GrowersNearYouProps) {
  const [area, setArea] = useState(() => getLocalAreaName(zipCode));
  const [apiInsights, setApiInsights] = useState<LocalPlantInsight[] | null>(null);
  const [weatherFlags, setWeatherFlags] = useState({
    hot: false,
    dry: false,
    frost: false,
    rain: false,
  });

  useEffect(() => {
    if (!zipCode?.trim()) return;
    let cancelled = false;

    fetch("/api/intelligence/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zip_code: zipCode }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (json: {
          ok?: boolean;
          data?: { area?: string; insights?: LocalPlantInsight[]; risks?: { kind: string }[] };
        } | null) => {
          if (cancelled || !json?.ok || !json.data?.insights?.length) return;
          setApiInsights(json.data.insights);
          if (json.data.area) setArea(json.data.area);
          const risks = json.data.risks ?? json.data.insights
            .filter((i) => i.type === "weather_risk")
            .map((i) => ({ kind: i.emoji === "🔥" ? "heat" : i.emoji === "❄️" ? "frost" : "rain" }));
          setWeatherFlags({
            hot: risks.some((r) => r.kind === "heat"),
            frost: risks.some((r) => r.kind === "frost"),
            rain: risks.some((r) => r.kind === "rain"),
            dry: risks.some((r) => r.kind === "heat"),
          });
        }
      )
      .catch(() => {
        /* local fallback */
      });

    return () => {
      cancelled = true;
    };
  }, [zipCode]);

  const hasIntelligence = intelligence?.source === "f5bot";

  const pulse = useMemo(
    () =>
      buildGrowerPulse({
        zipCode,
        apiTitles: apiInsights?.map((i) => i.title),
        f5Topics: intelligence?.topicCounts?.length
          ? intelligence.topicCounts
          : intelligence?.f5Topics,
        topProblems: intelligence?.topProblems,
        hasIntelligenceData: hasIntelligence,
        weatherHot: weatherFlags.hot,
        weatherDry: weatherFlags.dry,
        weatherFrost: weatherFlags.frost,
        weatherRain: weatherFlags.rain,
      }),
    [zipCode, apiInsights, intelligence, hasIntelligence, weatherFlags]
  );

  if (pulse.lines.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Local Grower Pulse</h2>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {area}
          </p>
        </div>
      </div>
      <Card padding="md" className="space-y-2.5">
        {pulse.lines.map((line) => (
          <p key={line.id} className="text-sm text-gray-700 flex gap-2">
            <span aria-hidden>{line.emoji}</span>
            <span>{line.text}</span>
          </p>
        ))}
        <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
          {pulse.footer}
        </p>
        <div className="pt-1 flex flex-wrap gap-x-4">
          <Link href="/community">
            <Button variant="ghost" size="sm" className="text-green-700 touch-manipulation px-0">
              Local community <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="text-green-700 touch-manipulation px-0">
              Full schedule <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}

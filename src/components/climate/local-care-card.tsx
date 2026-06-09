"use client";

import { MapPin, AlertTriangle, Wind, Snowflake, CloudRain, Droplets } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildLocalInsights } from "@/lib/location/location-service";
import { useWeather } from "@/lib/hooks/use-weather";
import type { Plant } from "@/lib/types";
import type { WeatherAlert } from "@/lib/types/phase6";

const alertIcons: Record<WeatherAlert["type"], React.ElementType> = {
  heat: AlertTriangle,
  frost: Snowflake,
  wind: Wind,
  rain: CloudRain,
  humidity: Droplets,
};

interface LocalCareCardProps {
  plants: Plant[];
  plant?: Plant;
  compact?: boolean;
}

export function LocalCareCard({ plants, plant, compact = false }: LocalCareCardProps) {
  const zip = plant?.zipCode ?? plants[0]?.zipCode ?? "91107";
  const contextPlants = plant ? [plant] : plants;
  const { weather } = useWeather(zip);
  const insights = buildLocalInsights(zip, weather, contextPlants);
  const { profile } = insights;
  const topAlert = weather.alerts[0];
  const topRec = insights.plantRecommendations[0];
  const AlertIcon = topAlert ? alertIcons[topAlert.type] : MapPin;

  return (
    <Card
      padding="md"
      className="border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-emerald-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
              Local Care Intelligence
            </p>
            <Badge variant="outline" className="text-[10px]">
              {weather.source === "live" ? "Live weather" : "Mock fallback"}
            </Badge>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {profile.city}, {profile.state} · Zone {profile.usdaZone}
            {weather.tempF ? ` · ${weather.tempF}°F` : ""}
          </p>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">{insights.headline}</p>
        </div>
      </div>

      {!compact && topAlert && (
        <div className="mt-4 flex gap-2 p-3 rounded-xl bg-white border border-emerald-50 text-sm">
          <AlertIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{topAlert.title}</p>
            <p className="text-gray-500 text-xs mt-0.5">{topAlert.message}</p>
          </div>
        </div>
      )}

      {topRec && (
        <div className="mt-3 p-3 rounded-xl bg-white/80 border border-emerald-50">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-medium text-gray-500">
              {plant ? "For this plant" : topRec.plantName}
            </p>
            <Badge variant="outline" className="text-[10px]">
              {topRec.confidence} confidence
            </Badge>
          </div>
          <p className="text-sm text-gray-800">{topRec.message}</p>
        </div>
      )}

      {!compact && insights.careAdjustments[0] && (
        <p className="mt-3 text-xs text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">
          Because you live here: {insights.careAdjustments[0]}
        </p>
      )}
    </Card>
  );
}

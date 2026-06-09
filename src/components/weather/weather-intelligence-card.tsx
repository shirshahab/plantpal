"use client";

import { CloudSun, AlertTriangle, Wind, Snowflake, CloudRain, Droplets } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export function WeatherIntelligenceCard({ plants }: { plants: Plant[] }) {
  const zip = plants[0]?.zipCode ?? "91107";
  const { weather } = useWeather(zip);

  return (
    <Card padding="md" className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
          <CloudSun className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              Local Weather Intelligence
            </p>
            <Badge variant="outline" className="text-[10px]">
              {weather.source === "live" ? "Live" : "Mock"}
            </Badge>
          </div>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {weather.location} · {weather.tempF}°F · {weather.condition}
          </p>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{weather.summary}</p>
          {weather.recommendedWateringAdjustment && (
            <p className="text-xs text-blue-700 mt-2">{weather.recommendedWateringAdjustment}</p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {weather.alerts.map((alert) => {
          const Icon = alertIcons[alert.type] ?? CloudSun;
          return (
            <div
              key={alert.title}
              className="flex gap-2 p-3 rounded-xl bg-white border border-blue-50 text-sm"
            >
              <Icon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{alert.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{alert.message}</p>
                <p className="text-blue-700 text-xs mt-1">{alert.wateringAdjustment}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DataSourceLabel =
  | "live_weather"
  | "mock_weather"
  | "perenual"
  | "plantpal_db"
  | "ai_generated"
  | "ai_suggestion"
  | "mock_fallback"
  | "live_shopping"
  | "estimated_price"
  | "plantnet"
  | "seed_data";

const LABELS: Record<DataSourceLabel, string> = {
  live_weather: "Live weather",
  mock_weather: "Typical conditions",
  perenual: "Perenual plant data",
  plantpal_db: "PlantPal database",
  ai_generated: "Personalized for your garden",
  ai_suggestion: "PlantPal suggestion",
  mock_fallback: "PlantPal library",
  live_shopping: "Live shopping result",
  estimated_price: "Estimated price",
  plantnet: "Pl@ntNet",
  seed_data: "PlantPal library",
};

const VARIANTS: Record<DataSourceLabel, "success" | "warning" | "outline" | "danger"> = {
  live_weather: "success",
  mock_weather: "warning",
  perenual: "outline",
  plantpal_db: "success",
  ai_generated: "outline",
  ai_suggestion: "warning",
  mock_fallback: "warning",
  live_shopping: "success",
  estimated_price: "warning",
  plantnet: "outline",
  seed_data: "outline",
};

export function DataSourceBadge({
  source,
  className,
}: {
  source: DataSourceLabel;
  className?: string;
}) {
  return (
    <Badge variant={VARIANTS[source]} className={cn("text-[10px] font-medium", className)}>
      {LABELS[source]}
    </Badge>
  );
}

export function dataSourceFromWeather(source: "live" | "mock"): DataSourceLabel {
  return source === "live" ? "live_weather" : "mock_weather";
}

export function dataSourceFromPrice(source: "live" | "mock"): DataSourceLabel {
  return source === "live" ? "live_shopping" : "estimated_price";
}

export function dataSourceFromPlantHit(
  resultSource: "plantpal" | "perenual" | "ai" | "mock" | "live"
): DataSourceLabel {
  if (resultSource === "perenual") return "perenual";
  if (resultSource === "ai") return "ai_suggestion";
  if (resultSource === "mock") return "mock_fallback";
  return "plantpal_db";
}

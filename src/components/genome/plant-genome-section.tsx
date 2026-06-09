"use client";

import { Dna, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/loading-state";
import type { Plant } from "@/lib/types";
import { usePlantGenome } from "@/lib/store/genome-provider";
import { useWeather } from "@/lib/hooks/use-weather";
import {
  IntelligenceScoreBadge,
  ScoreBar,
  StageBadge,
  TrendPill,
} from "./genome-metrics";
import { PlantForecastPanel } from "./plant-forecast-panel";
import { cn } from "@/lib/utils";

const LIFE_STAGE_LABELS: Record<string, string> = {
  seedling: "Seedling",
  juvenile: "Juvenile",
  establishing: "Establishing",
  mature: "Mature",
  senescent: "Senescent",
};

export function PlantGenomeSection({ plant }: { plant: Plant }) {
  const { weather, loading: weatherLoading } = useWeather(plant.zipCode);
  const { genome, loading } = usePlantGenome(plant, {
    tempF: weather.tempF,
    tempHighF: weather.tempHighF,
    alerts: weather.alerts?.map((a) => ({ type: a.type, severity: a.severity })),
  });

  if (loading || weatherLoading) {
    return <LoadingState message="Mapping plant genome…" />;
  }

  if (!genome) return null;

  const bloomActive = genome.bloomStage === "blooming" || genome.bloomStage === "pre_bloom";
  const fruitActive =
    genome.fruitStage !== "none" && genome.fruitStage !== "pre_fruit";
  const dormantActive =
    genome.dormancyStatus === "dormant" || genome.dormancyStatus === "slowing";

  return (
    <section id="genome" className="space-y-4">
      <Card className="overflow-hidden border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-violet-50/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Dna className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Plant Genome</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Digital twin · {genome.speciesBaseline.commonName}
                </p>
              </div>
            </div>
            <IntelligenceScoreBadge score={genome.intelligenceScore} />
          </div>
          <p className="text-xs text-indigo-700/80 mt-3 leading-relaxed">
            This genome evolves as you add photos, complete tasks, scan health, log growth, and as weather changes.
            Species data describes the type — genome data describes <strong>this plant</strong>.
          </p>
        </CardHeader>

        <CardContent className="space-y-5 pt-0">
          {/* Age + life stage */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/80 border border-gray-100 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Age</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{genome.ageLabel}</p>
              <p className="text-[10px] text-gray-400">{genome.ageDays} days</p>
            </div>
            <div className="rounded-xl bg-white/80 border border-gray-100 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Life stage</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {LIFE_STAGE_LABELS[genome.lifeStage]}
              </p>
            </div>
            <div className="rounded-xl bg-white/80 border border-gray-100 px-3 py-2 col-span-2 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Trends</p>
              <div className="flex flex-wrap gap-1.5">
                <TrendPill direction={genome.growthTrend.direction} label={`Growth ${genome.growthTrend.label}`} />
                <TrendPill direction={genome.healthTrend.direction} label={`Health ${genome.healthTrend.label}`} />
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                {genome.growthTrend.detail}
              </p>
            </div>
          </div>

          {/* Phenological stages */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Phenological state
            </p>
            <div className="grid grid-cols-3 gap-2">
              <StageBadge label="Bloom" value={genome.bloomStage} active={bloomActive} />
              <StageBadge label="Fruit" value={genome.fruitStage} active={fruitActive} />
              <StageBadge label="Dormancy" value={genome.dormancyStatus} active={dormantActive} />
            </div>
          </div>

          {/* Risk + recovery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ScoreBar label="Risk score" score={genome.riskScore} variant="risk" />
            <ScoreBar label="Recovery score" score={genome.recoveryScore} variant="recovery" />
          </div>

          {/* Telemetry summary */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-1 border-t border-indigo-100/60">
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              {genome.telemetrySummary.photoCount} photos
            </span>
            <span>{genome.telemetrySummary.growthMeasurements} growth logs</span>
            <span>{genome.telemetrySummary.tasksCompleted} tasks done</span>
            <span>{genome.telemetrySummary.healthScans} health scans</span>
            {genome.telemetrySummary.lastEvolvedAt && (
              <span className={cn("text-indigo-600")}>
                Last event {new Date(genome.telemetrySummary.lastEvolvedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <PlantForecastPanel
        forecast30={genome.forecast30}
        forecast90={genome.forecast90}
        forecastSeason={genome.forecastSeason}
        milestones={genome.upcomingMilestones}
      />
    </section>
  );
}

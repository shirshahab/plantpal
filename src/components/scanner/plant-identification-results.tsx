"use client";

import Link from "next/link";
import {
  Sun,
  Droplets,
  AlertTriangle,
  Gauge,
  Sparkles,
  Plus,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PlantIdentificationResponse } from "@/lib/types/ai";
import { cn } from "@/lib/utils";

interface PlantIdentificationResultsProps {
  result: PlantIdentificationResponse;
  saving?: boolean;
  onSave: () => void;
  onRetake: () => void;
  canSave?: boolean;
  lowConfidenceAcknowledged?: boolean;
  onAcknowledgeLowConfidence?: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  plantid: "Plant.id",
  openai: "OpenAI Vision",
  mock: "Demo mode",
};

export function PlantIdentificationResults({
  result,
  saving,
  onSave,
  onRetake,
  canSave = true,
  lowConfidenceAcknowledged,
  onAcknowledgeLowConfidence,
}: PlantIdentificationResultsProps) {
  const needsAcknowledgement = result.low_confidence && !lowConfidenceAcknowledged;

  return (
    <Card padding="md" className="page-enter space-y-4 border-green-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{result.common_name}</h2>
          <p className="text-sm text-gray-500 italic mt-0.5">{result.scientific_name}</p>
        </div>
        <ConfidenceBadge score={result.confidence_score} level={result.confidence} />
      </div>

      {result.low_confidence && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-950">Low confidence match</p>
              <p className="text-sm text-amber-900/90 mt-1 leading-relaxed">
                We are not sure about this identification ({result.confidence_score}%).
                Try a clearer photo of leaves or flowers, or confirm before saving.
              </p>
            </div>
          </div>
          {needsAcknowledgement && onAcknowledgeLowConfidence && (
            <Button
              variant="outline"
              size="sm"
              className="w-full touch-manipulation border-amber-300"
              onClick={onAcknowledgeLowConfidence}
            >
              I understand — show save option
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <CareCell icon={Sun} label="Light needs" value={result.light_needs} />
        <CareCell icon={Droplets} label="Watering" value={result.watering_needs} />
        <CareCell icon={AlertTriangle} label="Toxicity" value={result.toxicity} />
        <CareCell icon={Gauge} label="Difficulty" value={result.care_difficulty} />
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">{result.care_summary}</p>

      {result.plantid_suggestions && result.plantid_suggestions.length > 1 && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Other possibilities
          </p>
          {result.plantid_suggestions.slice(1, 4).map((s) => (
            <div key={s.scientificName} className="flex justify-between text-sm text-gray-700">
              <span className="min-w-0 truncate pr-2">
                {s.commonNames[0] ?? s.scientificName}
              </span>
              <Badge variant="outline">{s.probability}%</Badge>
            </div>
          ))}
        </div>
      )}

      {result.plantnet_second_opinion && result.plantnet_second_opinion.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Pl@ntNet second opinion
          </p>
          {result.plantnet_second_opinion.slice(0, 3).map((s) => (
            <div key={s.species} className="flex justify-between text-sm text-gray-700">
              <span>{s.commonNames[0] ?? s.species}</span>
              <Badge variant="outline">{s.score}%</Badge>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <Button
          className="w-full h-14 touch-manipulation"
          loading={saving}
          disabled={!canSave || needsAcknowledgement}
          onClick={onSave}
        >
          <Plus className="w-5 h-5" />
          Save to My Garden
        </Button>
        <Button variant="outline" className="w-full touch-manipulation" onClick={onRetake}>
          <RotateCcw className="w-4 h-4" />
          Scan another plant
        </Button>
        {result.database_species_id && (
          <Link href={`/database/plants/${result.database_species_id}`}>
            <Button variant="secondary" className="w-full">
              <BookOpen className="w-4 h-4" />
              View in plant database
            </Button>
          </Link>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3" />
        {PROVIDER_LABELS[result.identification_provider] ?? "AI"}
        {result.source === "mock" && " · add PLANT_ID_API_KEY or OPENAI_API_KEY for live ID"}
      </p>
    </Card>
  );
}

function ConfidenceBadge({
  score,
  level,
}: {
  score: number;
  level: "high" | "medium" | "low";
}) {
  return (
    <div className="text-right shrink-0">
      <Badge
        variant={level === "high" ? "success" : level === "medium" ? "warning" : "danger"}
        className="tabular-nums"
      >
        {score}%
      </Badge>
      <p className={cn("text-[10px] mt-1 capitalize", level === "low" ? "text-red-600" : "text-gray-400")}>
        {level} confidence
      </p>
    </div>
  );
}

function CareCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-400 font-medium">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <p className="text-sm text-gray-800 mt-1 leading-snug line-clamp-3">{value}</p>
    </div>
  );
}

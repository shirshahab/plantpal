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
  HelpCircle,
  Lightbulb,
  GitCompare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadPhotoGuidance, LowConfidenceGuidance } from "@/components/scanner/bad-photo-guidance";
import { mergePhotoQuality } from "@/lib/scanner/photo-quality";
import {
  getConsensusLabel,
  getPlantNetSourceLabel,
  getPrimarySourceLabel,
} from "@/lib/scanner/identification-source-labels";
import { markScanAddedToGarden } from "@/lib/scanner/scan-history";
import { AiSafetyDisclaimer } from "@/components/ai/ai-safety-disclaimer";
import type { PhotoQualityAssessment, PlantIdentificationResponse } from "@/lib/types/ai";
import { cn } from "@/lib/utils";

export const SCAN_PREFILL_KEY = "plantpal-scan-prefill";

interface IdentifyPlantResultsProps {
  result: PlantIdentificationResponse;
  preview: string | null;
  previews?: string[];
  clientPhotoQuality?: PhotoQualityAssessment | null;
  scanHistoryId?: string | null;
  onRetake: () => void;
}

export function IdentifyPlantResults({
  result,
  preview,
  previews,
  clientPhotoQuality,
  scanHistoryId,
  onRetake,
}: IdentifyPlantResultsProps) {
  const photoQuality = mergePhotoQuality(clientPhotoQuality ?? null, result.photo_quality);
  const badPhoto = !photoQuality.acceptable;
  const liveAiUnavailable =
    result.source === "mock" || result.identification_provider === "mock";

  const notConfident =
    result.not_fully_confident ??
    (result.confidence_score < 70 || result.low_confidence || result.providers_disagree);

  const headline = liveAiUnavailable
    ? "We couldn't identify this plant. Try another photo."
    : (result.friendly_headline ??
      (badPhoto
        ? "PlantPal needs a clearer photo before identifying this plant."
        : `PlantPal thinks this is likely a ${result.common_name}.`));

  const primaryLabel = getPrimarySourceLabel(result);
  const plantNetLabel = getPlantNetSourceLabel(result.plantnet_configured ?? false);
  const consensusLabel = getConsensusLabel(result.providers_disagree);

  function savePrefill(unknown = false) {
    if (scanHistoryId && !unknown) {
      markScanAddedToGarden(scanHistoryId);
    }
    sessionStorage.setItem(
      SCAN_PREFILL_KEY,
      JSON.stringify({
        ...result,
        imageDataUrl: preview,
        imageDataUrls: previews ?? (preview ? [preview] : []),
        unknown,
      })
    );
    window.location.href = unknown ? "/plants/new?from=scan&unknown=1" : "/plants/new?from=scan";
  }

  return (
    <div className="space-y-4 page-enter">
      <AiSafetyDisclaimer />
      {liveAiUnavailable && (
        <Card padding="md" className="border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-950">
            We couldn&apos;t identify this plant
          </p>
          <p className="text-sm text-amber-900/90 mt-1 leading-relaxed">
            Try another photo with the whole plant and a leaf close-up in good light.
          </p>
        </Card>
      )}

      {badPhoto && <BadPhotoGuidance quality={photoQuality} />}

      {!badPhoto && !liveAiUnavailable && notConfident && (
        <LowConfidenceGuidance onRetake={onRetake} onSaveUnknown={() => savePrefill(true)} />
      )}

      {result.providers_disagree && !badPhoto && (
        <Card padding="md" className="border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-950">
            Identification sources disagree
          </p>
          <p className="text-sm text-amber-900/90 mt-1 leading-relaxed">
            OpenAI and Pl@ntNet suggest different plants — add another angle before adding to
            your garden.
          </p>
        </Card>
      )}

      <Card padding="md" className={cn("space-y-4", badPhoto || liveAiUnavailable ? "border-gray-200 opacity-90" : "border-green-100")}>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant={liveAiUnavailable ? "outline" : "success"} className="text-[10px]">
            {liveAiUnavailable ? "Unidentified" : primaryLabel}
          </Badge>
          {!liveAiUnavailable && plantNetLabel && (
            <Badge variant="outline" className="text-[10px]">
              {plantNetLabel}
            </Badge>
          )}
          {consensusLabel && (
            <Badge variant="warning" className="text-[10px]">
              {consensusLabel}
            </Badge>
          )}
          {!badPhoto && !liveAiUnavailable && (
            <Badge
              variant={result.confidence_score >= 70 ? "success" : "warning"}
              className="text-[10px] ml-auto tabular-nums"
            >
              {result.confidence_score}% confidence
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-800 leading-relaxed font-medium">{headline}</p>
          {!badPhoto && !liveAiUnavailable && (
            <div>
              <p className="text-xs font-medium text-green-700 uppercase tracking-wide">
                Best match
              </p>
              <h2 className="text-xl font-bold text-gray-900 leading-tight mt-1">
                {result.common_name}
              </h2>
              <p className="text-sm text-gray-500 italic">{result.scientific_name}</p>
            </div>
          )}
        </div>

        {!badPhoto && !liveAiUnavailable && result.top_matches.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Other possibilities
            </p>
            <div className="space-y-2">
              {result.top_matches.slice(0, 3).map((match, i) => (
                <div
                  key={`${match.scientific_name}-${i}`}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border",
                    i === 0
                      ? "border-green-200 bg-green-50/60"
                      : "border-gray-100 bg-gray-50/80"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {match.common_name}
                    </p>
                    <p className="text-xs text-gray-500 italic truncate">{match.scientific_name}</p>
                  </div>
                  {i > 0 && (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      Alternate
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!badPhoto && !liveAiUnavailable && (
          <>
            <section className="rounded-xl bg-indigo-50/60 border border-indigo-100 px-4 py-3">
              <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Why we think this
              </p>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                {result.identification_rationale}
              </p>
            </section>

            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Care preview
              </p>
              <div className="grid grid-cols-2 gap-2">
                <CareCell icon={Sun} label="Light" value={result.light_needs} />
                <CareCell icon={Droplets} label="Water" value={result.watering_needs} />
                <CareCell icon={Gauge} label="Difficulty" value={result.care_difficulty} />
                <CareCell icon={Sparkles} label="Summary" value={result.care_summary} compact />
              </div>
            </section>

            {(result.toxicity_warning || result.toxicity) && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Toxicity warning
                </p>
                <p className="text-sm text-amber-950 mt-2 leading-relaxed">
                  {result.toxicity_warning ?? result.toxicity}
                </p>
              </section>
            )}

            {result.common_lookalikes.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5" />
                  Common lookalikes
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.common_lookalikes.map((name) => (
                    <span
                      key={name}
                      className="text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-full px-3 py-1"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {result.plantnet_available &&
              result.plantnet_second_opinion &&
              result.plantnet_second_opinion.length > 0 && (
                <section className="pt-2 border-t border-gray-100 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Pl@ntNet second opinion
                  </p>
                  {result.plantnet_second_opinion.slice(0, 3).map((s) => (
                    <div
                      key={s.species}
                      className="flex items-center justify-between gap-2 text-sm text-gray-700"
                    >
                      <span className="min-w-0">
                        {s.commonNames[0] ?? s.species}
                        <span className="block text-xs text-gray-400 italic truncate">
                          {s.species}
                        </span>
                      </span>
                      <Badge variant="outline" className="shrink-0 tabular-nums text-[10px]">
                        {s.score}% match
                      </Badge>
                    </div>
                  ))}
                </section>
              )}

            {!result.plantnet_configured && (
              <p className="text-xs text-gray-400 text-center pt-1">
                Optional Pl@ntNet second opinion not connected — add PLANTNET_API_KEY to enable.
              </p>
            )}
          </>
        )}

        <div className="flex flex-col gap-2 pt-1">
          {!badPhoto && !liveAiUnavailable && (
            <Button
              className="w-full h-14 touch-manipulation"
              onClick={() => savePrefill(false)}
            >
              <Plus className="w-5 h-5" />
              Add to My Garden
            </Button>
          )}
          <Button
            variant={badPhoto ? "primary" : "outline"}
            className={cn("w-full touch-manipulation", badPhoto ? "h-14" : "h-12")}
            onClick={onRetake}
          >
            <RotateCcw className="w-4 h-4" />
            {badPhoto ? "Retake clearer photo" : "Take another photo"}
          </Button>
          {!badPhoto && !liveAiUnavailable && (
            <Button
              variant="outline"
              className="w-full h-12 touch-manipulation"
              onClick={() => savePrefill(true)}
            >
              <HelpCircle className="w-4 h-4" />
              Save as Unknown
            </Button>
          )}
          {!badPhoto && !liveAiUnavailable && result.database_species_id && (
            <Link href={`/database/plants/${result.database_species_id}`}>
              <Button variant="secondary" className="w-full touch-manipulation">
                View in plant database
              </Button>
            </Link>
          )}
        </div>

        <p className="text-[11px] text-gray-400 text-center">
          {liveAiUnavailable
            ? "Configure OPENAI_API_KEY for live identification"
            : `${primaryLabel}${plantNetLabel ? ` · ${plantNetLabel}` : ""}`}
        </p>
      </Card>
    </div>
  );
}

function CareCell({
  icon: Icon,
  label,
  value,
  compact,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-400 font-medium">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <p
        className={cn(
          "text-sm text-gray-800 mt-1 leading-snug",
          compact ? "line-clamp-3" : "line-clamp-2"
        )}
      >
        {value}
      </p>
    </div>
  );
}

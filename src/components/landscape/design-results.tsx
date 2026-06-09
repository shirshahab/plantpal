"use client";

import Image from "next/image";
import {
  CheckCircle2,
  Droplets,
  Flower2,
  ImageIcon,
  Leaf,
  ListOrdered,
  Shovel,
  Sun,
  TreeDeciduous,
  Wrench,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BudgetOptionCards } from "@/components/landscape/budget-option-cards";
import type { LandscapeDesignResponse } from "@/lib/landscape/types";
import { MAINTENANCE_LABELS, SPACE_TYPE_LABELS, SUN_EXPOSURE_LABELS } from "@/lib/landscape/types";

interface DesignResultsProps {
  design: LandscapeDesignResponse;
  photoPreview?: string | null;
  onSave?: () => void;
  onVisualConcept?: () => void;
  saving?: boolean;
  visualConceptRequested?: boolean;
}

function PlantList({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-green-600" />
        <p className="font-semibold text-gray-900">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-gray-700 flex gap-2">
            <span className="text-green-500 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function DesignResults({
  design,
  photoPreview,
  onSave,
  onVisualConcept,
  saving,
  visualConceptRequested,
}: DesignResultsProps) {
  const { analysis, climate, recommendations, irrigation } = design;

  return (
    <div className="space-y-6">
      {photoPreview && (
        <Card padding="none" className="overflow-hidden">
          <div className="relative aspect-video max-h-56 bg-gray-100">
            <Image
              src={photoPreview}
              alt="Your space"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </Card>
      )}

      <Card padding="md" className="bg-green-50/50 border-green-100">
        <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">
          Design concept
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{design.design_summary}</p>
        <p className="text-xs text-gray-500 mt-2">
          {design.source === "ai" ? "AI analysis" : "Demo analysis"} ·{" "}
          {SPACE_TYPE_LABELS[analysis.space_type]} · Zone {climate.usda_zone} ·{" "}
          Est. {design.estimated_budget}
        </p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="md">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Space estimate
          </p>
          <p className="font-semibold text-gray-900">{analysis.estimated_sq_ft}</p>
          <p className="text-sm text-gray-600 mt-1">{analysis.estimated_dimensions}</p>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Sun exposure
            </p>
          </div>
          <p className="font-semibold text-gray-900">
            {SUN_EXPOSURE_LABELS[analysis.sunlight]}
          </p>
          <p className="text-sm text-gray-600 mt-1">{analysis.sunlight_notes}</p>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-gray-500" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Maintenance
            </p>
          </div>
          <p className="font-semibold text-gray-900">
            {MAINTENANCE_LABELS[design.maintenance_level]}
          </p>
          <p className="text-sm text-gray-600 mt-1">{design.maintenance_notes}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Climate · {climate.city}
          </p>
          <p className="text-sm text-gray-700">
            ZIP {climate.zip_code} · Zone {climate.usda_zone} · {climate.climate_type}
          </p>
          <p className="text-sm text-green-700 mt-2">{climate.season_note}</p>
        </Card>
      </div>

      {analysis.existing_plants.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-4 h-4 text-green-600" />
            <p className="font-semibold text-gray-900">Existing plants detected</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {analysis.existing_plants.map((p) => (
              <li
                key={p}
                className="text-sm bg-green-50 text-green-800 px-3 py-1 rounded-full"
              >
                {p}
              </li>
            ))}
          </ul>
          {analysis.site_notes && (
            <p className="text-sm text-gray-600 mt-3">{analysis.site_notes}</p>
          )}
        </Card>
      )}

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">Plant recommendations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlantList title="Trees" icon={TreeDeciduous} items={recommendations.trees} />
          <PlantList title="Shrubs" icon={Leaf} items={recommendations.shrubs} />
          <PlantList title="Flowers" icon={Flower2} items={recommendations.flowers} />
          <PlantList title="Ground cover" icon={Leaf} items={recommendations.ground_cover} />
        </div>
      </div>

      <Card padding="md">
        <div className="flex items-center gap-2 mb-2">
          <Droplets className="w-4 h-4 text-blue-500" />
          <p className="font-semibold text-gray-900">Irrigation</p>
        </div>
        <p className="text-sm font-medium text-gray-800">{irrigation.approach}</p>
        <p className="text-sm text-gray-600 mt-2">{irrigation.notes}</p>
      </Card>

      <Card padding="md">
        <div className="flex items-center gap-2 mb-2">
          <Shovel className="w-4 h-4 text-amber-700" />
          <p className="font-semibold text-gray-900">Soil prep</p>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{design.soil_prep}</p>
      </Card>

      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <ListOrdered className="w-4 h-4 text-green-600" />
          <p className="font-semibold text-gray-900">What to do first</p>
        </div>
        <ol className="space-y-2">
          {design.first_steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-gray-700">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">Plan options</p>
        <BudgetOptionCards options={design.budget_options} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {onSave && (
          <Button className="flex-1 touch-manipulation" loading={saving} onClick={onSave}>
            <CheckCircle2 className="w-5 h-5" />
            Save Landscape Project
          </Button>
        )}
        {onVisualConcept && (
          <Button
            variant="secondary"
            className="flex-1 touch-manipulation"
            onClick={onVisualConcept}
            disabled={visualConceptRequested}
          >
            <ImageIcon className="w-5 h-5" />
            {visualConceptRequested ? "Visual concept queued" : "Generate Visual Concept"}
          </Button>
        )}
      </div>

      {visualConceptRequested && (
        <Card padding="md" className="border-dashed border-amber-200 bg-amber-50/30">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Visual concept — coming soon.</span> AI-generated
            landscape mockups will appear here in a future release.
          </p>
        </Card>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import {
  CheckCircle2,
  DollarSign,
  Droplets,
  ImageIcon,
  Layers,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LandscapeDesignResponse, StyleGoal } from "@/lib/landscape/types";
import { MAINTENANCE_LABELS } from "@/lib/landscape/types";
import { getGardenStyleOption } from "@/lib/landscape/garden-styles";
import { cn } from "@/lib/utils";

interface LandscapeResultsMvpProps {
  design: LandscapeDesignResponse;
  styleGoal: StyleGoal;
  beforeUrl?: string | null;
  onSave?: () => void;
  saving?: boolean;
}

export function LandscapeResultsMvp({
  design,
  styleGoal,
  beforeUrl,
  onSave,
  saving,
}: LandscapeResultsMvpProps) {
  const style = getGardenStyleOption(styleGoal);

  return (
    <div className="space-y-6">
      {/* Before / After */}
      <Card padding="md" className="space-y-4">
        <p className="text-sm font-semibold text-gray-900">Before & after</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Before</p>
            {beforeUrl ? (
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border">
                <Image src={beforeUrl} alt="Your yard before" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                No photo
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-green-700 uppercase mb-2">After</p>
            {design.after_image_url ? (
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-green-200">
                <Image
                  src={design.after_image_url}
                  alt="Concept design"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                  Concept Design
                </span>
              </div>
            ) : (
              <div
                className={cn(
                  "relative aspect-[4/3] rounded-xl overflow-hidden border border-green-100 bg-gradient-to-br p-4 flex flex-col justify-end",
                  style.afterGradient
                )}
              >
                <span className="absolute top-2 left-2 bg-white/80 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                  Concept Design
                </span>
                <p className="font-semibold text-gray-900 text-sm relative z-10">
                  {design.after_concept.headline}
                </p>
                <p className="text-xs text-gray-700 mt-1 line-clamp-3 relative z-10">
                  {design.after_concept.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Design brief */}
      <Card padding="md" className="bg-green-50/40 border-green-100">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-green-600" />
          <p className="font-semibold text-gray-900">Design concept</p>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{design.design_summary}</p>
        {design.layout_suggestions.length > 0 && (
          <ul className="mt-3 space-y-1">
            {design.layout_suggestions.map((s) => (
              <li key={s} className="text-xs text-gray-600 flex gap-2">
                <span className="text-green-500">→</span> {s}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-500 uppercase">Estimated cost</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{design.estimated_budget}</p>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-4 h-4 text-amber-600" />
            <p className="text-xs text-gray-500 uppercase">Maintenance</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {MAINTENANCE_LABELS[design.maintenance_level]}
          </p>
          <p className="text-xs text-gray-500">Score: {design.maintenance_score}/100 upkeep</p>
        </Card>
        <Card padding="md" className="col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-500 uppercase">Water requirements</p>
          </div>
          <p className="text-sm font-medium text-gray-900">{design.irrigation.approach}</p>
          <p className="text-xs text-gray-500 mt-1">{design.irrigation.notes}</p>
        </Card>
      </div>

      {/* Plant list */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-900">Plant list</p>
          <Badge variant="outline">{design.plant_list.length} items</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[340px]">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-2 pr-2">Plant</th>
                <th className="pb-2 pr-2">Qty</th>
                <th className="pb-2 pr-2">Local fit</th>
                <th className="pb-2 text-right">Est.</th>
              </tr>
            </thead>
            <tbody>
              {design.plant_list.map((item) => (
                <tr key={`${item.name}-${item.quantity}`} className="border-b border-gray-50">
                  <td className="py-2 pr-2">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{item.category.replace("_", " ")}</p>
                  </td>
                  <td className="py-2 pr-2 text-gray-600">{item.quantity}</td>
                  <td className="py-2 pr-2">
                    {item.suitability_score != null ? (
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          item.suitability_score >= 70 ? "text-green-700" : "text-amber-600"
                        )}
                      >
                        {item.suitability_score}% {item.suitability_label ?? ""}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2 text-right text-green-700 text-xs font-medium">
                    {item.est_price ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100">
          {(
            [
              ["Trees", design.recommendations.trees],
              ["Shrubs", design.recommendations.shrubs],
              ["Flowers", design.recommendations.flowers],
              ["Ground cover", design.recommendations.ground_cover],
            ] as const
          ).map(([label, items]) => (
            <div key={label}>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
              <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                {items.slice(0, 3).map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Phased plan */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-green-600" />
          <p className="font-semibold text-gray-900">Phased install plan</p>
        </div>
        <div className="space-y-4">
          {design.phased_plan.map((phase) => (
            <div key={phase.phase} className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-bold text-gray-900">
                  Phase {phase.phase}: {phase.title}
                </p>
                <Badge variant="outline">{phase.timeframe}</Badge>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 mb-2">
                {phase.tasks.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="text-green-500">✓</span> {t}
                  </li>
                ))}
              </ul>
              <p className="text-xs font-semibold text-green-700">{phase.estimated_cost}</p>
            </div>
          ))}
        </div>
      </Card>

      {onSave && (
        <Button className="w-full touch-manipulation" size="lg" loading={saving} onClick={onSave}>
          <CheckCircle2 className="w-5 h-5" />
          Save project to my account
        </Button>
      )}

      {!design.after_image_url && (
        <Card padding="sm" className="border-dashed">
          <div className="flex gap-2 text-xs text-gray-500">
            <ImageIcon className="w-4 h-4 shrink-0" />
            <p>
              AI concept render unavailable in demo mode. Connect OpenAI for photorealistic Concept
              Design images (~$0.04 per render).
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

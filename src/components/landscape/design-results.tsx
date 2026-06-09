"use client";

import Image from "next/image";
import {
  CheckCircle2,
  DollarSign,
  ImageIcon,
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

interface DesignResultsProps {
  design: LandscapeDesignResponse;
  styleGoal: StyleGoal;
  photoPreview?: string | null;
  onSave?: () => void;
  saving?: boolean;
}

function BeforeAfterPanel({
  beforeUrl,
  after,
  styleGoal,
}: {
  beforeUrl: string;
  after: LandscapeDesignResponse["after_concept"];
  styleGoal: StyleGoal;
}) {
  const style = getGardenStyleOption(styleGoal);

  return (
    <Card padding="md" className="space-y-4">
      <p className="text-sm font-semibold text-gray-900">Before & after</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Before</p>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
            <Image src={beforeUrl} alt="Your yard before" fill className="object-cover" unoptimized />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-green-700 uppercase mb-2">After · AI concept</p>
          <div
            className={cn(
              "relative aspect-[4/3] rounded-xl overflow-hidden border border-green-100 bg-gradient-to-br p-4 flex flex-col justify-end",
              style.afterGradient
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_50%)]" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-green-700" />
                <p className="font-semibold text-gray-900 text-sm">{after.headline}</p>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                {after.description}
              </p>
            </div>
          </div>
        </div>
      </div>
      {after.key_changes.length > 0 && (
        <ul className="space-y-1.5">
          {after.key_changes.map((change) => (
            <li key={change} className="text-sm text-gray-600 flex gap-2">
              <span className="text-green-500 shrink-0">→</span>
              {change}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DesignResults({
  design,
  styleGoal,
  photoPreview,
  onSave,
  saving,
}: DesignResultsProps) {
  const style = getGardenStyleOption(styleGoal);

  return (
    <div className="space-y-6">
      {photoPreview && design.after_concept && (
        <BeforeAfterPanel
          beforeUrl={photoPreview}
          after={design.after_concept}
          styleGoal={styleGoal}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card padding="md" className="bg-green-50/50 border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-gray-500 uppercase">Estimated cost</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{design.estimated_budget}</p>
          <p className="text-xs text-gray-500 mt-1">{style.label} · typical install</p>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-medium text-gray-500 uppercase">Maintenance</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {MAINTENANCE_LABELS[design.maintenance_level]}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{design.maintenance_notes}</p>
        </Card>
      </div>

      <Card padding="md">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="font-semibold text-gray-900">Plant list</p>
          <Badge variant="outline">{design.plant_list.length} items</Badge>
        </div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 pr-3 font-medium">Plant</th>
                <th className="pb-2 pr-3 font-medium">Qty</th>
                <th className="pb-2 font-medium text-right">Est.</th>
              </tr>
            </thead>
            <tbody>
              {design.plant_list.map((item) => (
                <tr key={`${item.name}-${item.quantity}`} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{item.category.replace("_", " ")}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-gray-600">{item.quantity}</td>
                  <td className="py-2.5 text-right text-green-700 font-medium text-xs">
                    {item.est_price ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="md" className="bg-gray-50/50 border-gray-100">
        <p className="text-xs font-medium text-gray-400 uppercase mb-1">Design summary</p>
        <p className="text-sm text-gray-700 leading-relaxed">{design.design_summary}</p>
        <p className="text-xs text-gray-400 mt-2">
          {design.source === "ai" ? "AI analysis" : "Preview analysis"} · Zone {design.climate.usda_zone} ·{" "}
          {design.climate.city}
        </p>
      </Card>

      {onSave && (
        <Button className="w-full touch-manipulation" size="lg" loading={saving} onClick={onSave}>
          <CheckCircle2 className="w-5 h-5" />
          Save design to my account
        </Button>
      )}

      <Card padding="sm" className="border-dashed border-gray-200 bg-gray-50/30">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <ImageIcon className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            After preview is an AI concept description. Photorealistic renders will be added in a
            future update.
          </p>
        </div>
      </Card>
    </div>
  );
}

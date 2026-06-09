"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlantSpecies } from "@/lib/knowledge/types";
import { calculateSuitabilityScore } from "@/lib/location/suitability";

export function SuitabilityScoreCard({
  species,
  defaultZip = "91107",
}: {
  species: PlantSpecies;
  defaultZip?: string;
}) {
  const [zip, setZip] = useState(defaultZip);

  const result = useMemo(
    () => calculateSuitabilityScore(species, { zipCode: zip }),
    [species, zip]
  );

  const variant =
    result.score >= 85 ? "success" : result.score >= 65 ? "info" : result.score >= 45 ? "warning" : "danger";

  return (
    <Card padding="md" className="border-green-100">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Suitability Score
          </p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">
            {species.common_name} in {zip}: {result.score}/100
          </p>
        </div>
        <Badge variant={variant}>{result.label}</Badge>
      </div>
      <Input
        label="Your ZIP code"
        value={zip}
        onChange={(e) => setZip(e.target.value.slice(0, 5))}
        inputMode="numeric"
        className="max-w-[140px]"
      />
      <p className="text-sm text-gray-600 mt-3 leading-relaxed">{result.summary}</p>
    </Card>
  );
}

"use client";

import { getLocalMatchCheck } from "@/lib/location/suitability";
import type { LocationType, PlantingType, SunExposure } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FIT_VARIANT = {
  "Great fit": "success" as const,
  "Good fit": "info" as const,
  Caution: "warning" as const,
  Risky: "danger" as const,
};

export function LocalMatchCheck({
  name,
  species,
  zipCode,
  locationType,
  plantingType,
  sunExposure,
}: {
  name: string;
  species: string;
  zipCode: string;
  locationType: LocationType;
  plantingType: PlantingType;
  sunExposure?: SunExposure;
}) {
  if (zipCode.trim().length < 5) return null;

  const check = getLocalMatchCheck({
    name,
    species,
    zipCode,
    locationType,
    plantingType,
    sunExposure,
  });

  return (
    <Card padding="md" className="border-blue-100 bg-blue-50/40 mt-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900">Local match check</p>
        <Badge variant={FIT_VARIANT[check.fitLabel]}>{check.fitLabel}</Badge>
      </div>
      <p className="text-sm text-gray-700">{check.message}</p>
      {check.tips.length > 0 && (
        <ul className="mt-2 space-y-1">
          {check.tips.map((tip) => (
            <li key={tip} className="text-xs text-blue-800">
              · {tip}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

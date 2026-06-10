"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { GardenScoreCard } from "@/components/score/garden-score-card";
import { usePlants } from "@/lib/store/plants-provider";
import { useMoat } from "@/lib/store/moat-provider";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { calculatePlantHealthScore } from "@/lib/scoring";
import type { Plant } from "@/lib/types";

interface PropertyZone {
  id: string;
  name: string;
  description: string;
  plants: Plant[];
}

function buildZones(plants: Plant[]): PropertyZone[] {
  const zones: PropertyZone[] = [];
  const outdoorGround = plants.filter(
    (p) => p.locationType === "outdoor" && p.plantingType === "ground"
  );
  const outdoorPots = plants.filter(
    (p) => p.locationType === "outdoor" && p.plantingType === "pot"
  );
  const indoor = plants.filter((p) => p.locationType === "indoor");

  if (outdoorGround.length > 0) {
    zones.push({
      id: "zone-yard",
      name: "Yard & Beds",
      description: "In-ground outdoor plants",
      plants: outdoorGround,
    });
  }
  if (outdoorPots.length > 0) {
    zones.push({
      id: "zone-patio",
      name: "Patio & Containers",
      description: "Outdoor potted plants",
      plants: outdoorPots,
    });
  }
  if (indoor.length > 0) {
    zones.push({
      id: "zone-indoor",
      name: "Indoor",
      description: "Houseplants",
      plants: indoor,
    });
  }
  return zones;
}

export default function PropertyPage() {
  const { plants } = usePlants();
  const { seasonalTasks } = useMoat();
  const [zipCode, setZipCode] = useState("");

  useEffect(() => {
    setZipCode(loadUserProfile().zipCode || plants[0]?.zipCode || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zones = useMemo(() => buildZones(plants), [plants]);
  const topSeasonal = seasonalTasks.slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Property"
        description={zipCode ? `Property mode · ZIP ${zipCode}` : "Property mode"}
      />

      {plants.length === 0 ? (
        <EmptyState
          icon="🏡"
          title="No property plants yet"
          description="Add plants to see zone health scores and seasonal landscape tasks."
          actionLabel="Add Plant"
          actionHref="/plants/new"
        />
      ) : (
        <>
          <GardenScoreCard plants={plants} />

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">Zones</p>
            {zones.map((zone) => {
              const avgScore = Math.round(
                zone.plants.reduce((s, p) => s + calculatePlantHealthScore(p), 0) /
                  zone.plants.length
              );

              return (
                <Card key={zone.id} padding="md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{zone.name}</p>
                      <p className="text-xs text-gray-500">
                        {zone.description} · {zone.plants.length}{" "}
                        {zone.plants.length === 1 ? "plant" : "plants"}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-600">{avgScore}</span>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {zone.plants.slice(0, 4).map((p) => (
                      <li key={p.id} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-green-500">•</span>
                        {p.name}
                      </li>
                    ))}
                    {zone.plants.length > 4 && (
                      <li className="text-xs text-gray-400">
                        +{zone.plants.length - 4} more
                      </li>
                    )}
                  </ul>
                </Card>
              );
            })}
          </div>

          {topSeasonal.length > 0 && (
            <Card padding="md">
              <p className="text-sm font-semibold text-gray-900 mb-2">Seasonal tasks</p>
              <ul className="space-y-2">
                {topSeasonal.map((t) => (
                  <li key={t.id} className="text-sm text-gray-600 p-2 rounded-lg bg-green-50/50">
                    {t.title}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

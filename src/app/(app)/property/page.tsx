"use client";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { GardenScoreCard } from "@/components/score/garden-score-card";
import { MOCK_PROPERTY, SEASONAL_TASKS } from "@/lib/mock/property";
import { usePlants } from "@/lib/store/plants-provider";
import { calculatePlantHealthScore } from "@/lib/scoring";

export default function PropertyPage() {
  const { plants } = usePlants();
  const property = MOCK_PROPERTY;

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.name}
        description={`Property mode · ZIP ${property.zipCode}`}
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
        {property.zones.map((zone) => {
          const zonePlants = plants.filter((p) =>
            zone.plantIds.length ? zone.plantIds.includes(p.id) : true
          ).slice(0, 4);
          const avgScore =
            zonePlants.length > 0
              ? Math.round(
                  zonePlants.reduce((s, p) => s + calculatePlantHealthScore(p), 0) /
                    zonePlants.length
                )
              : 0;

          return (
            <Card key={zone.id} padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{zone.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {zone.type.replace("_", " ")}
                  </p>
                </div>
                {avgScore > 0 && (
                  <span className="text-sm font-bold text-green-600">{avgScore}</span>
                )}
              </div>
              <ul className="mt-3 space-y-1">
                {zone.tasks.map((t) => (
                  <li key={t} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-green-500">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card padding="md">
        <p className="text-sm font-semibold text-gray-900 mb-2">Seasonal tasks</p>
        <ul className="space-y-2">
          {SEASONAL_TASKS.map((t) => (
            <li key={t} className="text-sm text-gray-600 p-2 rounded-lg bg-green-50/50">
              {t}
            </li>
          ))}
        </ul>
      </Card>
        </>
      )}
    </div>
  );
}

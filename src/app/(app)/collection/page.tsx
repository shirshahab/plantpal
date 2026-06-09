"use client";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlants } from "@/lib/store/plants-provider";
import { useEngagement } from "@/lib/store/engagement-provider";
import type { RarityLevel } from "@/lib/types/phase6";
import { EmptyState } from "@/components/empty-state";

const RARITY_COLORS: Record<RarityLevel, string> = {
  Common: "default",
  Uncommon: "info",
  Rare: "warning",
  "Very Rare": "danger",
};

export default function CollectionPage() {
  const { plants } = usePlants();
  const { rarityMap } = useEngagement();

  const withRarity = plants.map((p) => ({
    plant: p,
    rarity: rarityMap[p.id] ?? {
      plantId: p.id,
      level: "Common" as RarityLevel,
      estimatedValue: 25,
      collectorNotes: "",
    },
  }));

  const rare = withRarity.filter((r) => r.rarity.level !== "Common");
  const totalValue = withRarity.reduce((s, r) => s + r.rarity.estimatedValue, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rare Collection"
        description="Track rarity, value, and collector notes."
      />

      {plants.length === 0 ? (
        <EmptyState
          icon="💎"
          title="Start your collection"
          description="Add plants to track rarity, estimated value, and collector notes."
          actionLabel="Add Plant"
          actionHref="/plants/new"
        />
      ) : (
        <>
      <div className="grid grid-cols-3 gap-3">
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-gray-900">{plants.length}</p>
          <p className="text-xs text-gray-500">Total plants</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-amber-600">{rare.length}</p>
          <p className="text-xs text-gray-500">Rare+</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-green-600">${totalValue}</p>
          <p className="text-xs text-gray-500">Est. value</p>
        </Card>
      </div>

      <div className="space-y-3">
        {withRarity.map(({ plant, rarity }) => (
          <Card key={plant.id} padding="md" className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{plant.name}</p>
              <p className="text-xs text-gray-500 italic">{plant.species}</p>
            </div>
            <div className="text-right shrink-0">
              <Badge variant={RARITY_COLORS[rarity.level] as "default"}>{rarity.level}</Badge>
              <p className="text-xs text-gray-400 mt-1">${rarity.estimatedValue}</p>
            </div>
          </Card>
        ))}
      </div>
        </>
      )}
    </div>
  );
}

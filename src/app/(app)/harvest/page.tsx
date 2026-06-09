"use client";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useEngagement } from "@/lib/store/engagement-provider";
import { usePlants } from "@/lib/store/plants-provider";
import { formatDate } from "@/lib/utils";

export default function HarvestPage() {
  const { harvestEntries } = useEngagement();
  const { plants } = usePlants();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const thisMonth = harvestEntries.filter(
    (e) => new Date(e.harvestDate) >= monthStart
  );
  const thisYear = harvestEntries.filter(
    (e) => new Date(e.harvestDate) >= yearStart
  );

  const monthTotal = thisMonth.reduce((s, e) => s + e.quantity, 0);
  const yearTotal = thisYear.reduce((s, e) => s + e.quantity, 0);

  const byPlant = harvestEntries.reduce<Record<string, number>>((acc, e) => {
    acc[e.plantId] = (acc[e.plantId] ?? 0) + e.quantity;
    return acc;
  }, {});

  const topPlants = Object.entries(byPlant)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, qty]) => ({
      name: plants.find((p) => p.id === id)?.name ?? "Unknown",
      qty,
    }));

  return (
    <div className="space-y-6">
      <PageHeader title="Harvest Log" description="Track what your garden gives back." />

      {harvestEntries.length === 0 ? (
        <EmptyState
          icon="🌾"
          title="No harvests logged yet"
          description="When your fruit trees or vegetables produce, log yields here to track your garden's output."
          actionLabel="View fruit trees"
          actionHref="/plants"
        />
      ) : (
        <>
      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <p className="text-xs text-gray-500">This month</p>
          <p className="text-2xl font-bold text-gray-900">{monthTotal}</p>
          <p className="text-xs text-gray-400">items harvested</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-gray-500">This year</p>
          <p className="text-2xl font-bold text-gray-900">{yearTotal}</p>
          <p className="text-xs text-gray-400">items harvested</p>
        </Card>
      </div>

      {topPlants.length > 0 && (
        <Card padding="md">
          <p className="text-sm font-semibold text-gray-900 mb-2">Top producers</p>
          {topPlants.map((p) => (
            <div key={p.name} className="flex justify-between text-sm py-1">
              <span>{p.name}</span>
              <span className="font-medium text-green-600">{p.qty}</span>
            </div>
          ))}
        </Card>
      )}

      <Card padding="md">
        <p className="text-sm font-semibold text-gray-900 mb-3">History</p>
        <div className="space-y-2">
          {harvestEntries.map((e) => (
            <div key={e.id} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
              <span>
                <span className="font-medium">{e.quantity} {e.unit}</span> {e.cropName}
              </span>
              <span className="text-gray-400 text-xs">{formatDate(e.harvestDate)}</span>
            </div>
          ))}
        </div>
      </Card>
        </>
      )}
    </div>
  );
}

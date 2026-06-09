"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PlantCard } from "@/components/plant-card";
import { EmptyState } from "@/components/empty-state";
import { PlantCardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePlants } from "@/lib/store/plants-provider";

export default function PlantsPage() {
  const { plants, loading } = usePlants();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PlantCardSkeleton />
        <PlantCardSkeleton />
        <PlantCardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="All Plants"
        description={`${plants.length} plant${plants.length !== 1 ? "s" : ""} in your collection`}
        action={
          <Link href="/plants/new">
            <Button>
              <Plus className="w-4 h-4" />
              Add Plant
            </Button>
          </Link>
        }
      />

      {plants.length === 0 ? (
        <EmptyState
          icon="🌿"
          title="Let's add your first plant."
          description="Build your collection — each plant gets its own care schedule and journey."
          actionLabel="Scan Plant"
          actionHref="/scanner"
          secondaryLabel="Add Plant Manually"
          secondaryHref="/plants/new"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}

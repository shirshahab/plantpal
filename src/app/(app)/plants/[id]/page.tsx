"use client";

import { use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { PlantDetailView } from "@/components/plants/plant-detail-view";
import { usePlants } from "@/lib/store/plants-provider";

export default function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState fullPage message="Loading plant..." />}>
      <PlantDetailContent params={params} />
    </Suspense>
  );
}

function PlantDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const showWelcome = searchParams.get("welcome") === "1";
  const { getPlant, loading } = usePlants();
  const plant = getPlant(id);

  if (loading) {
    return <LoadingState fullPage message="Loading plant..." />;
  }

  if (!plant) {
    return (
      <EmptyState
        icon="🔍"
        title="Plant not found"
        description="This plant doesn't exist or may have been removed."
        actionLabel="Back to Garden"
        actionHref="/plants"
      />
    );
  }

  return <PlantDetailView plant={plant} showWelcome={showWelcome} />;
}

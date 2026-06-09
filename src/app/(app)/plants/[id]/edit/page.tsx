"use client";

import { use } from "react";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { EditPlantForm } from "@/components/plants/edit-plant-form";
import { usePlants } from "@/lib/store/plants-provider";

export default function EditPlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getPlant, loading } = usePlants();
  const plant = getPlant(id);

  if (loading) return <LoadingState fullPage message="Loading plant..." />;

  if (!plant) {
    return (
      <EmptyState
        icon="🔍"
        title="Plant not found"
        description="This plant may have been removed."
        actionLabel="Back to Garden"
        actionHref="/plants"
      />
    );
  }

  return <EditPlantForm plant={plant} />;
}

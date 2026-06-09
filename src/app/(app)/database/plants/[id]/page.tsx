import { notFound } from "next/navigation";
import { getPlantSpeciesDetail } from "@/lib/knowledge/queries";
import { PlantSpeciesDetailView } from "@/components/knowledge/plant-species-detail";
import { DatabaseNav } from "@/components/knowledge/database-nav";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlantSpeciesPage({ params }: PageProps) {
  const { id } = await params;
  const plant = await getPlantSpeciesDetail(id);

  if (!plant) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <DatabaseNav />
      <PlantSpeciesDetailView plant={plant} />
    </div>
  );
}

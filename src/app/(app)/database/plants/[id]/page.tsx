import { notFound } from "next/navigation";
import { getPlantSpeciesDetail } from "@/lib/knowledge/queries";
import { PlantSpeciesDetailView } from "@/components/knowledge/plant-species-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlantSpeciesPage({ params }: PageProps) {
  const { id } = await params;
  const plant = await getPlantSpeciesDetail(id);

  if (!plant) {
    notFound();
  }

  return <PlantSpeciesDetailView plant={plant} />;
}

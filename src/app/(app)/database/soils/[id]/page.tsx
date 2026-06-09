import { notFound } from "next/navigation";
import { DatabaseNav } from "@/components/knowledge/database-nav";
import { SoilDetailView } from "@/components/knowledge/soil-detail";
import { getSoilById } from "@/lib/knowledge";

export default async function SoilDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const soil = getSoilById(id);
  if (!soil) notFound();

  return (
    <div className="space-y-6">
      <DatabaseNav />
      <SoilDetailView soil={soil} />
    </div>
  );
}

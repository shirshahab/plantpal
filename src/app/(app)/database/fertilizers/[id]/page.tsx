import { notFound } from "next/navigation";
import { DatabaseNav } from "@/components/knowledge/database-nav";
import { FertilizerDetailView } from "@/components/knowledge/fertilizer-detail";
import { getFertilizerById } from "@/lib/knowledge";

export default async function FertilizerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fertilizer = getFertilizerById(id);
  if (!fertilizer) notFound();

  return (
    <div className="space-y-6">
      <DatabaseNav />
      <FertilizerDetailView fertilizer={fertilizer} />
    </div>
  );
}

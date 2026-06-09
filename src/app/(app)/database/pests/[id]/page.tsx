import { notFound } from "next/navigation";
import { DatabaseNav } from "@/components/knowledge/database-nav";
import { PestDetailView } from "@/components/knowledge/pest-detail";
import { getPestById } from "@/lib/knowledge";

export default async function PestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pest = getPestById(id);
  if (!pest) notFound();

  return (
    <div className="space-y-6">
      <DatabaseNav />
      <PestDetailView pest={pest} />
    </div>
  );
}

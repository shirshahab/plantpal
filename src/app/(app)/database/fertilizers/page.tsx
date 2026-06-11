"use client";

import { PageHeader } from "@/components/page-header";
import { DatabaseNav } from "@/components/knowledge/database-nav";
import { FertilizerSearchPanel } from "@/components/knowledge/fertilizer-search";
import { getFertilizerCount } from "@/lib/knowledge";

export default function FertilizersDatabasePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fertilizer Database"
        description={`${getFertilizerCount()} fertilizers: NPK, usage, frequency, and best plants.`}
      />
      <DatabaseNav />
      <FertilizerSearchPanel />
    </div>
  );
}

"use client";

import { PageHeader } from "@/components/page-header";
import { DatabaseNav } from "@/components/knowledge/database-nav";
import { SoilSearchPanel } from "@/components/knowledge/soil-search";
import { getSoilCount } from "@/lib/knowledge";

export default function SoilsDatabasePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Soil Database"
        description={`${getSoilCount()} soil types: drainage, water retention, pros, cons, and best plants.`}
      />
      <DatabaseNav />
      <SoilSearchPanel />
    </div>
  );
}

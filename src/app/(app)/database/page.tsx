"use client";

import { PageHeader } from "@/components/page-header";
import { DatabaseNav } from "@/components/knowledge/database-nav";
import { SpeciesSearchPanel } from "@/components/knowledge/species-search";
import { getSpeciesCount } from "@/lib/knowledge";

export default function DatabasePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Knowledge Engine"
        description={`Reference library — ${getSpeciesCount()}+ species with care guides, soils, fertilizers, and pest profiles.`}
      />
      <DatabaseNav />
      <SpeciesSearchPanel />
    </div>
  );
}

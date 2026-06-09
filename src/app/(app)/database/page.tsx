"use client";

import { PageHeader } from "@/components/page-header";
import { SpeciesSearchPanel } from "@/components/knowledge/species-search";
import { getSpeciesCount } from "@/lib/knowledge";

export default function DatabasePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Database"
        description={`Search ${getSpeciesCount()}+ species with care guides, soil matches, fertilizers, and pest & disease risks.`}
      />
      <SpeciesSearchPanel />
    </div>
  );
}

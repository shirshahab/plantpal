"use client";

import { PageHeader } from "@/components/page-header";
import { DatabaseNav } from "@/components/knowledge/database-nav";
import { PestSearchPanel } from "@/components/knowledge/pest-search";
import { getPestCount } from "@/lib/knowledge";

export default function PestsDatabasePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pest Database"
        description={`${getPestCount()} common pests — identification, treatment, and prevention.`}
      />
      <DatabaseNav />
      <PestSearchPanel />
    </div>
  );
}

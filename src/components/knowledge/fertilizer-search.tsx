"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { FertilizerCard } from "@/components/knowledge/fertilizer-card";
import { searchFertilizers } from "@/lib/knowledge";

export function FertilizerSearchPanel() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchFertilizers({ query }), [query]);

  return (
    <div className="space-y-4">
      <Input
        id="fertilizer-search"
        placeholder="Search fertilizers by name, type, or use…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-base"
      />
      <p className="text-sm text-gray-500">{results.length} fertilizers</p>
      {results.length === 0 ? (
        <EmptyState
          icon="🧪"
          title="No fertilizers found"
          description="Try a different search term."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((fert) => (
            <FertilizerCard key={fert.id} fertilizer={fert} />
          ))}
        </div>
      )}
    </div>
  );
}

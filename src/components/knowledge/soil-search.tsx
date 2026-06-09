"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { SoilCard } from "@/components/knowledge/soil-card";
import { searchSoilTypes } from "@/lib/knowledge";

export function SoilSearchPanel() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchSoilTypes({ query }), [query]);

  return (
    <div className="space-y-4">
      <Input
        id="soil-search"
        placeholder="Search soils by name or best use…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-base"
      />
      <p className="text-sm text-gray-500">{results.length} soil types</p>
      {results.length === 0 ? (
        <EmptyState
          icon="🪨"
          title="No soils found"
          description="Try a different search term."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((soil) => (
            <SoilCard key={soil.id} soil={soil} />
          ))}
        </div>
      )}
    </div>
  );
}

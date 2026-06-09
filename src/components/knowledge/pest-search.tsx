"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { PestCard } from "@/components/knowledge/pest-card";
import { searchPests } from "@/lib/knowledge";

export function PestSearchPanel() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchPests({ query }), [query]);

  return (
    <div className="space-y-4">
      <Input
        id="pest-search"
        placeholder="Search pests by name or affected plants…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-base"
      />
      <p className="text-sm text-gray-500">{results.length} pests</p>
      {results.length === 0 ? (
        <EmptyState
          icon="🐛"
          title="No pests found"
          description="Try a different search term."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((pest) => (
            <PestCard key={pest.id} pest={pest} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlantSpeciesCard } from "@/components/knowledge/plant-species-card";
import { EmptyState } from "@/components/empty-state";
import {
  getSpeciesCount,
  PLANT_TYPE_LABELS,
  type PlantSpeciesType,
} from "@/lib/knowledge";
import { searchPlantsApi, importPlantSpecies } from "@/lib/integrations/client";
import type { PlantSearchHit } from "@/lib/types/integrations";

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  ...Object.entries(PLANT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const SUNLIGHT_OPTIONS = [
  { value: "", label: "Any sunlight" },
  { value: "full sun", label: "Full sun" },
  { value: "partial", label: "Partial shade" },
  { value: "indirect", label: "Indirect / indoor" },
  { value: "shade", label: "Shade" },
];

const WATERING_OPTIONS = [
  { value: "", label: "Any watering" },
  { value: "dry", label: "Dry / infrequent" },
  { value: "moist", label: "Moist / regular" },
  { value: "deep", label: "Deep water" },
];

const SOURCE_LABELS: Record<string, string> = {
  plantpal: "PlantPal database",
  perenual: "Perenual plant data",
  ai: "AI suggestion",
  mock: "Mock fallback",
};

function SourceBadge({ source }: { source: PlantSearchHit["resultSource"] }) {
  const variant =
    source === "perenual"
      ? "outline"
      : source === "ai"
        ? "warning"
        : source === "mock"
          ? "warning"
          : "success";
  return (
    <Badge variant={variant} className="text-[10px] shrink-0">
      {SOURCE_LABELS[source] ?? source}
    </Badge>
  );
}

export function SpeciesSearchPanel({
  onSelect,
  compact = false,
}: {
  onSelect?: (
    id: string,
    commonName: string,
    scientificName: string,
    imageUrl: string,
    hit?: PlantSearchHit
  ) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<PlantSpeciesType | "">("");
  const [sunlight, setSunlight] = useState("");
  const [watering, setWatering] = useState("");
  const [zone, setZone] = useState("");
  const [results, setResults] = useState<PlantSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      query,
      type: type || undefined,
      sunlight: sunlight || undefined,
      watering: watering || undefined,
      zone: zone ? Number(zone) : undefined,
    }),
    [query, type, sunlight, watering, zone]
  );

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const data = await searchPlantsApi(filters);
      if (!cancelled) {
        setResults(data.results);
        setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters]);

  async function handleSelect(hit: PlantSearchHit) {
    if (!onSelect) return;

    let id = hit.id;
    if (hit.resultSource === "perenual") {
      setImportingId(hit.id);
      const imported = await importPlantSpecies(hit.id);
      setImportingId(null);
      if (imported) id = imported.id;
    }

    onSelect(id, hit.common_name, hit.scientific_name, hit.image_url, hit);
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <p className="text-sm text-gray-500">
          Browse {getSpeciesCount()}+ plants with care guides, soil matches, and pest risks.
          Perenual results appear when API key is configured.
        </p>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Search common or scientific name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 text-base py-3"
        />
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"}`}>
        <Select
          label={compact ? undefined : "Type"}
          value={type}
          onChange={(e) => setType(e.target.value as PlantSpeciesType | "")}
          options={TYPE_OPTIONS}
        />
        <Select
          label={compact ? undefined : "Sunlight"}
          value={sunlight}
          onChange={(e) => setSunlight(e.target.value)}
          options={SUNLIGHT_OPTIONS}
        />
        <Select
          label={compact ? undefined : "Watering"}
          value={watering}
          onChange={(e) => setWatering(e.target.value)}
          options={WATERING_OPTIONS}
        />
        <Input
          label={compact ? undefined : "Hardiness zone"}
          placeholder="e.g. 9"
          inputMode="numeric"
          value={zone}
          onChange={(e) => setZone(e.target.value.replace(/\D/g, "").slice(0, 2))}
        />
      </div>

      <p className="text-xs text-gray-400">
        {loading ? "Searching…" : `${results.length} plant${results.length !== 1 ? "s" : ""} found`}
      </p>

      {onSelect ? (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {results.slice(0, 50).map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={importingId === s.id}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-colors touch-manipulation disabled:opacity-60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-medium text-gray-900">{s.common_name}</span>
                  <span className="block text-xs text-gray-500 italic">{s.scientific_name}</span>
                </div>
                <SourceBadge source={s.resultSource} />
              </div>
              {importingId === s.id && (
                <span className="text-xs text-green-600 mt-1 block">Saving to database…</span>
              )}
            </button>
          ))}
          {!loading && results.length === 0 && (
            <EmptyState title="No plants found" description="Try a different search or filter." />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((s) => (
            <div key={s.id} className="relative">
              <PlantSpeciesCard species={s} />
              <div className="absolute top-2 right-2">
                <SourceBadge source={s.resultSource} />
              </div>
            </div>
          ))}
          {!loading && results.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                title="No plants found"
                description="Try adjusting your search or filters."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

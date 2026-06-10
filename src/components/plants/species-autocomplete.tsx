"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { SafeImage } from "@/components/plants/plant-image";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchPlantsApi } from "@/lib/integrations/client";
import {
  buildSpeciesSelection,
  type SpeciesSelection,
} from "@/lib/plants/species-selection";
import { PLANT_TYPE_LABELS, type PlantSpeciesType } from "@/lib/knowledge";
import type { PlantSearchHit } from "@/lib/types/integrations";
import { cn } from "@/lib/utils";

const SOURCE_BADGES: Record<string, { label: string; variant: "success" | "outline" | "warning" }> = {
  plantpal: { label: "PlantPal", variant: "success" },
  perenual: { label: "Perenual", variant: "outline" },
  ai: { label: "PlantPal", variant: "warning" },
  mock: { label: "PlantPal", variant: "success" },
};

function typeLabel(type: string | undefined): string {
  if (!type) return "";
  return PLANT_TYPE_LABELS[type as PlantSpeciesType] ?? type;
}

export function SpeciesAutocomplete({
  value,
  onTextChange,
  onSelect,
  label = "Species",
  placeholder = "Start typing — e.g. Bougainvillea, Meyer Lemon…",
}: {
  value: string;
  onTextChange: (text: string) => void;
  onSelect: (selection: SpeciesSelection) => void;
  label?: string;
  placeholder?: string;
}) {
  const [results, setResults] = useState<PlantSearchHit[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const skipNextSearch = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search — min 1 character, 300ms
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < 1) {
      setResults([]);
      setDidYouMean(null);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const data = await searchPlantsApi({ query, limit: 8 });
      if (cancelled) return;
      setResults(data.results.slice(0, 8));
      setDidYouMean(data.didYouMean ?? null);
      setLoading(false);
      setOpen(true);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  // Close dropdown on outside tap
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function handlePick(hit: PlantSearchHit) {
    setSelectingId(hit.id);
    const selection = await buildSpeciesSelection(hit);
    setSelectingId(null);
    setOpen(false);
    skipNextSearch.current = true;
    onSelect(selection);
  }

  function handleDidYouMean() {
    if (didYouMean) {
      onTextChange(didYouMean);
      setDidYouMean(null);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id="species-autocomplete"
          name="species"
          label={label}
          placeholder={placeholder}
          value={value}
          autoComplete="off"
          onChange={(e) => onTextChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0 && value.trim().length >= 1) setOpen(true);
          }}
          className="text-base py-3 pr-10"
        />
        <div className="absolute right-3 bottom-3.5 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {didYouMean && (
        <button
          type="button"
          onClick={handleDidYouMean}
          className="mt-2 text-sm text-green-700 font-medium touch-manipulation"
        >
          Did you mean <span className="underline">{didYouMean}</span>?
        </button>
      )}

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {results.map((hit) => {
            const badge = SOURCE_BADGES[hit.resultSource] ?? SOURCE_BADGES.mock;
            const isSelecting = selectingId === hit.id;
            return (
              <button
                key={hit.id}
                type="button"
                disabled={selectingId !== null}
                onClick={() => handlePick(hit)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-green-50/70 transition-colors touch-manipulation border-b border-gray-50 last:border-b-0",
                  isSelecting && "bg-green-50"
                )}
              >
                {hit.image_url ? (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-green-50">
                    <SafeImage
                      src={hit.image_url}
                      alt={hit.common_name}
                      plantText={`${hit.common_name} ${hit.scientific_name ?? ""}`}
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0 text-lg">
                    🌿
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {hit.common_name}
                  </p>
                  <p className="text-xs text-gray-500 italic truncate">
                    {hit.scientific_name}
                    {typeLabel(hit.type) && (
                      <span className="not-italic text-gray-400"> · {typeLabel(hit.type)}</span>
                    )}
                  </p>
                </div>
                {isSelecting ? (
                  <Loader2 className="w-4 h-4 text-green-600 animate-spin shrink-0" />
                ) : (
                  <Badge variant={badge.variant} className="text-[10px] shrink-0">
                    {badge.label}
                  </Badge>
                )}
              </button>
            );
          })}
          {!loading && results.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-500">No plants found.</p>
          )}
        </div>
      )}
    </div>
  );
}

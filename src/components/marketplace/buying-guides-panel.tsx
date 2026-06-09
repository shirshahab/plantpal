"use client";

import { useState } from "react";
import { BookOpen, ChevronRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/marketplace/product-card";
import type { BuyingGuideDetail } from "@/lib/marketplace/types";
import { getProductById } from "@/lib/marketplace/mock-products";

interface BuyingGuidesPanelProps {
  guides: BuyingGuideDetail[];
  zipCode?: string;
}

export function BuyingGuidesPanel({ guides, zipCode }: BuyingGuidesPanelProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = guides.find((g) => g.id === activeId);

  if (active) {
    const products = active.productIds
      .map((id) => getProductById(id))
      .filter(Boolean);

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setActiveId(null)}
          className="text-sm text-green-600 hover:underline touch-manipulation"
        >
          ← All buying guides
        </button>
        <Card padding="md" className="bg-gradient-to-br from-amber-50/50 to-white border-amber-100">
          <span className="text-3xl" aria-hidden>
            {active.icon}
          </span>
          <h2 className="text-lg font-semibold text-gray-900 mt-2">{active.title}</h2>
          {active.zipAware && zipCode && (
            <p className="text-xs text-amber-700 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              Tailored context for ZIP {zipCode}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{active.intro}</p>
        </Card>

        {active.plantPicks && active.plantPicks.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Top picks</p>
            <div className="space-y-2">
              {active.plantPicks.map((pick) => (
                <Card key={pick.name} padding="md">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-gray-900">{pick.name}</p>
                    {pick.zone && (
                      <span className="text-xs text-gray-400 shrink-0">Zone {pick.zone}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{pick.why}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Recommended products</p>
            <div className="grid grid-cols-1 gap-3">
              {products.map((p) => (
                <ProductCard key={p!.id} product={p!} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {guides.map((guide) => (
        <button
          key={guide.id}
          type="button"
          onClick={() => setActiveId(guide.id)}
          className="text-left touch-manipulation"
        >
          <Card
            padding="md"
            className="h-full hover:border-green-200 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0" aria-hidden>
                {guide.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-green-800 transition-colors">
                  {guide.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{guide.description}</p>
                {guide.zipAware && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 mt-2">
                    <MapPin className="w-3 h-3" />
                    ZIP-aware
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 shrink-0 mt-1" />
            </div>
          </Card>
        </button>
      ))}
    </div>
  );
}

export function BuyingGuidesTeaser({
  guides,
  onViewAll,
}: {
  guides: BuyingGuideDetail[];
  onViewAll?: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-green-600" />
          Buying guides
        </p>
        {onViewAll && (
          <button type="button" onClick={onViewAll} className="text-xs text-green-600 hover:underline">
            View all
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {guides.slice(0, 4).map((g) => (
          <Card key={g.id} padding="md" className="min-w-[200px] shrink-0">
            <span className="text-xl">{g.icon}</span>
            <p className="text-sm font-medium text-gray-900 mt-2 leading-snug">{g.title}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

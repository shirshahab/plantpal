"use client";

import { useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { useMoat } from "@/lib/store/moat-provider";
import {
  ALL_MARKETPLACE_PRODUCTS,
  MARKETPLACE_CATEGORIES,
  productsByCategory,
  type MarketplaceCategory,
} from "@/lib/moat/marketplace-catalog";
import { cn } from "@/lib/utils";

const SOURCE_LABELS = {
  amazon: "Amazon",
  home_depot: "Home Depot",
  local_nursery: "Local nursery",
  serpapi: "Web",
};

export function MarketplaceHub() {
  const { recommendedProducts, plantLabels } = useMoat();
  const [category, setCategory] = useState<MarketplaceCategory | "all" | "recommended">(
    recommendedProducts.length > 0 ? "recommended" : "all"
  );

  const products =
    category === "recommended"
      ? recommendedProducts
      : category === "all"
        ? ALL_MARKETPLACE_PRODUCTS
        : productsByCategory(category);

  return (
    <div className="space-y-6 max-w-lg mx-auto page-enter">
      <PageHeader
        title="Marketplace"
        description="Curated picks for your garden — affiliate-ready architecture"
      />

      {recommendedProducts.length > 0 && (
        <Card padding="md" className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Recommended for your garden</p>
              <p className="text-xs text-gray-500 mt-1">
                Based on {plantLabels.slice(0, 3).join(", ")}
                {plantLabels.length > 3 ? "…" : ""} from your garden map
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {recommendedProducts.length > 0 && (
          <button
            type="button"
            onClick={() => setCategory("recommended")}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
              category === "recommended"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600"
            )}
          >
            ✨ For you
          </button>
        )}
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
            category === "all" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
          )}
        >
          All
        </button>
        {MARKETPLACE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
              category === c.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <Card key={product.id} padding="md" className="hover:shadow-md transition-shadow">
            <div className="flex gap-3">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover shrink-0 bg-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-green-50 flex items-center justify-center text-2xl shrink-0">
                  🌿
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{product.description}</p>
                <p className="text-sm font-bold text-green-600 mt-1">{product.priceRange}</p>
                {product.affiliateSource && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    via {SOURCE_LABELS[product.affiliateSource]}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 bg-gray-50 rounded-lg px-3 py-2">
              {product.whyItFits}
            </p>
            {(product.affiliateUrl || product.affiliateSource) && (
              <a
                href={product.affiliateUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700"
              >
                View product <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

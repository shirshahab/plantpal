"use client";

import { Package, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductRecommendation } from "@/lib/marketplace/types";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/marketplace/types";

interface ProductCardProps {
  product: ProductRecommendation;
  compact?: boolean;
}

export function ProductCard({ product, compact }: ProductCardProps) {
  return (
    <Card padding="md" className="space-y-3 hover:border-green-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Badge variant="outline" className="text-[10px] mb-2">
            {PRODUCT_CATEGORY_LABELS[product.category]}
          </Badge>
          <p className="font-semibold text-gray-900 leading-snug">{product.name}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-green-600" />
        </div>
      </div>

      {!compact && product.description && (
        <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
      )}

      <div className="text-xs space-y-2">
        <div>
          <p className="font-medium text-gray-500 uppercase tracking-wide">Best for</p>
          <p className="text-gray-800 mt-0.5">{product.bestFor}</p>
        </div>
        <div>
          <p className="font-medium text-gray-500 uppercase tracking-wide">Price range</p>
          <p className="text-gray-900 font-semibold mt-0.5">{product.priceRange}</p>
        </div>
      </div>

      <div className="rounded-xl bg-green-50/60 border border-green-100 px-3 py-2">
        <p className="text-xs font-medium text-green-800">Why it fits</p>
        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{product.whyItFits}</p>
      </div>

      <div className="flex gap-2 text-sm text-gray-600">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-amber-700">What to avoid</p>
          <p className="text-sm mt-0.5 leading-relaxed">{product.whatToAvoid}</p>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-50">
        Curated by the PlantPal team
      </p>
    </Card>
  );
}

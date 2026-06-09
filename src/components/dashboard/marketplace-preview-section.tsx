"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoat } from "@/lib/store/moat-provider";

export function DashboardMarketplacePreview() {
  const { recommendedProducts, plantLabels } = useMoat();
  const products = recommendedProducts.slice(0, 4);

  if (products.length === 0) return null;

  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-green-600" />
        <p className="text-xs font-semibold text-gray-400 uppercase">
          Recommended for your garden
        </p>
      </div>
      {plantLabels.length > 0 && (
        <p className="text-xs text-gray-500 mb-3">
          Based on {plantLabels.slice(0, 2).join(", ")}
          {plantLabels.length > 2 ? "…" : ""}
        </p>
      )}
      <div className="space-y-2">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-sm"
          >
            <span className="font-medium text-gray-900 truncate">{p.name}</span>
            <span className="text-xs font-semibold text-green-600 shrink-0">{p.priceRange}</span>
          </div>
        ))}
      </div>
      <Link href="/marketplace" className="inline-block mt-3">
        <Button variant="secondary" size="sm">
          Open Marketplace
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </Card>
  );
}

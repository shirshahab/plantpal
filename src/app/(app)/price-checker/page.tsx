"use client";

import { FeatureGate } from "@/components/subscription/feature-gate";
import { PriceCheckerPanel } from "@/components/price-checker/price-checker-panel";

export default function PriceCheckerPage() {
  return (
    <FeatureGate feature="price_checker">
      <PriceCheckerPanel />
    </FeatureGate>
  );
}

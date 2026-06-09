"use client";

import { FeatureGate } from "@/components/subscription/feature-gate";
import { PlantScannerPanel } from "@/components/scanner/plant-scanner-panel";

export default function PlantScannerPage() {
  return (
    <FeatureGate feature="plant_scanner">
      <PlantScannerPanel />
    </FeatureGate>
  );
}

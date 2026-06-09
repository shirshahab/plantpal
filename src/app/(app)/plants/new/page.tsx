"use client";

import { Suspense } from "react";
import { AddPlantWizard } from "@/components/mobile/add-plant-wizard";

export default function NewPlantPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
      <AddPlantWizard />
    </Suspense>
  );
}

import { Suspense } from "react";
import { GardenMapDesigner } from "@/components/garden-map/garden-map-designer";

export default function GardenMapDesignerPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto animate-pulse h-64 bg-gray-100 rounded-2xl" />}>
      <GardenMapDesigner />
    </Suspense>
  );
}

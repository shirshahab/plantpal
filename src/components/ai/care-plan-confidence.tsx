import type { Plant } from "@/lib/types";
import type { PlantGoal } from "@/lib/types/care-goals";
import {
  LOCATION_TYPE_LABELS,
  SUN_EXPOSURE_LABELS,
} from "@/lib/types";

function getLocalSeasonLabel(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Fall";
  return "Winter";
}

export function CarePlanConfidence({
  plant,
  goals,
}: {
  plant: Plant;
  goals: PlantGoal[];
}) {
  const items = [
    { label: "Plant species", value: plant.species || plant.name },
    { label: "ZIP code", value: plant.zipCode || "Not set" },
    { label: "Indoor / outdoor", value: LOCATION_TYPE_LABELS[plant.locationType] },
    { label: "Sun exposure", value: SUN_EXPOSURE_LABELS[plant.sunExposure] },
    {
      label: "Selected goals",
      value: goals.length > 0 ? goals.map((g) => g.name).join(", ") : "None yet",
    },
    { label: "Local season", value: getLocalSeasonLabel() },
  ];

  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-3 text-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        Based on
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex justify-between gap-3 text-xs">
            <span className="text-gray-500 shrink-0">{item.label}</span>
            <span className="font-medium text-gray-800 text-right">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import type { HarvestEntry } from "@/lib/types/phase6";

export const MOCK_HARVEST_ENTRIES: HarvestEntry[] = [
  {
    id: "harvest-1",
    plantId: "mock-1",
    userId: "mock-user",
    cropName: "Meyer lemons",
    quantity: 12,
    unit: "lemons",
    harvestDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    notes: "Great batch — very fragrant.",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "harvest-2",
    plantId: "mock-2",
    userId: "mock-user",
    cropName: "Basil",
    quantity: 1,
    unit: "bunch",
    harvestDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    notes: "Pinched before flowering.",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "harvest-3",
    plantId: "mock-3",
    userId: "mock-user",
    cropName: "Cherry tomatoes",
    quantity: 4,
    unit: "tomatoes",
    harvestDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: "",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export const EDIBLE_KEYWORDS = [
  "lemon", "lime", "orange", "tomato", "basil", "fig", "pepper",
  "strawberry", "blueberry", "herb", "citrus", "avocado", "peach",
  "apple", "grape", "rosemary", "mint", "lavender", "eggplant",
];

export function isEdiblePlant(species: string, name: string): boolean {
  const text = `${species} ${name}`.toLowerCase();
  return EDIBLE_KEYWORDS.some((k) => text.includes(k));
}

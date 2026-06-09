import type { GrowthEntry } from "@/lib/types/phase6";

export const MOCK_GROWTH_ENTRIES: GrowthEntry[] = [
  {
    id: "growth-1",
    plantId: "1",
    userId: "mock-user",
    photoUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    heightInches: 36,
    note: "First photo after repotting.",
    entryDate: new Date(Date.now() - 60 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "growth-2",
    plantId: "1",
    userId: "mock-user",
    photoUrl: "https://images.unsplash.com/photo-1587735240108-8e8712816788?w=400&h=300&fit=crop",
    heightInches: 42,
    note: "New flush of growth after deep watering.",
    entryDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

export function daysSincePlantStart(createdAt: string, entryDate: string): number {
  const start = new Date(createdAt).getTime();
  const entry = new Date(entryDate).getTime();
  return Math.max(1, Math.ceil((entry - start) / 86400000));
}

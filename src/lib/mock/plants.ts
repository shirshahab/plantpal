import type { Plant } from "@/lib/types";
import { withPlantDefaults } from "@/lib/supabase/mappers";

/** Investor-ready demo garden — Pasadena, CA (91107). */
const DEMO_GARDEN_RAW: Omit<
  Plant,
  "photoStatus" | "placeholderImageType" | "sizeType" | "nurseryContainerSize" | "heightFeet" | "heightInches" | "potDiameterInches" | "trunkDiameterInches" | "estimatedAgeMonths" | "plantedDate" | "purchaseDate" | "purchasePrice" | "purchaseStore"
>[] = [
  {
    id: "1",
    name: "Meyer Lemon Tree",
    species: "Citrus × meyeri",
    image:
      "https://images.unsplash.com/photo-1587735240108-8e8712816788?w=800&q=80",
    locationType: "outdoor",
    plantingType: "pot",
    zipCode: "91107",
    sunExposure: "full_sun",
    waterFrequencyDays: 3,
    fertilizeFrequencyWeeks: 6,
    pruneSchedule: "Late winter",
    healthStatus: "healthy",
    healthNotes: "Strong new growth on south-facing branch. First fruit forming.",
    wateringInstructions:
      "Water deeply when top inch of soil is dry. Reduce in winter.",
    fertilizingInstructions:
      "Use citrus-specific fertilizer every 6 weeks during growing season.",
    pruningInstructions:
      "Prune in late winter to shape and remove dead wood.",
    lastWateredAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    lastFertilizedAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    lastGrowthPhotoAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: "2",
    name: "Japanese Maple",
    species: "Acer palmatum",
    image:
      "https://images.unsplash.com/photo-1606041008023-472dfb5e5303?w=800&q=80",
    locationType: "outdoor",
    plantingType: "ground",
    zipCode: "91107",
    sunExposure: "partial_sun",
    waterFrequencyDays: 4,
    fertilizeFrequencyWeeks: 8,
    pruneSchedule: "Early spring",
    healthStatus: "needs_attention",
    healthNotes: "Some leaf tips browning — possible underwatering.",
    wateringInstructions:
      "Keep soil consistently moist but not waterlogged. Mulch around base.",
    fertilizingInstructions:
      "Light balanced fertilizer in early spring. Avoid high-nitrogen feeds.",
    pruningInstructions:
      "Prune in early spring before buds break. Remove crossing branches.",
    lastWateredAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastFertilizedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
  },
  {
    id: "3",
    name: "Fiddle Leaf Fig",
    species: "Ficus lyrata",
    image:
      "https://images.unsplash.com/photo-1459411550355-86995392579a?w=800&q=80",
    locationType: "indoor",
    plantingType: "pot",
    zipCode: "91107",
    sunExposure: "partial_sun",
    waterFrequencyDays: 7,
    fertilizeFrequencyWeeks: 8,
    pruneSchedule: "As needed",
    healthStatus: "healthy",
    healthNotes: "Two new leaves unfurling this week.",
    wateringInstructions:
      "Water when top 2 inches of soil are dry. Wipe leaves monthly.",
    fertilizingInstructions:
      "Diluted liquid fertilizer monthly in spring and summer.",
    pruningInstructions:
      "Trim top to control height. Propagate cuttings in water.",
    lastWateredAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    lastFertilizedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "4",
    name: "Bougainvillea",
    species: "Bougainvillea glabra",
    image:
      "https://images.unsplash.com/photo-1593691509543-c55fb32dca61?w=800&q=80",
    locationType: "outdoor",
    plantingType: "pot",
    zipCode: "91107",
    sunExposure: "full_sun",
    waterFrequencyDays: 2,
    fertilizeFrequencyWeeks: 4,
    pruneSchedule: "After blooming",
    healthStatus: "critical",
    healthNotes: "Yellowing leaves and pest spots detected on lower branches.",
    wateringInstructions:
      "Allow soil to dry between waterings. Bougainvillea prefers slight drought.",
    fertilizingInstructions:
      "High-phosphorus fertilizer every 4 weeks during bloom season.",
    pruningInstructions:
      "Prune after each bloom cycle to encourage new flowers.",
    lastWateredAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    lastFertilizedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    lastHealthScanAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "5",
    name: "Avocado Tree",
    species: "Persea americana",
    image:
      "https://images.unsplash.com/photo-1523049673857-711dc1c2cc55?w=800&q=80",
    locationType: "outdoor",
    plantingType: "ground",
    zipCode: "91107",
    sunExposure: "full_sun",
    waterFrequencyDays: 5,
    fertilizeFrequencyWeeks: 8,
    pruneSchedule: "Late winter",
    healthStatus: "healthy",
    healthNotes: "Young tree establishing well in Pasadena climate.",
    wateringInstructions:
      "Deep water weekly in summer. Mulch heavily to retain moisture.",
    fertilizingInstructions:
      "Balanced citrus/avocado fertilizer in spring and summer.",
    pruningInstructions:
      "Light shaping only — avocados bleed sap heavily if over-pruned.",
    lastWateredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    lastFertilizedAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
  },
];

export const DEMO_GARDEN_PLANTS: Plant[] = DEMO_GARDEN_RAW.map((p, i) =>
  withPlantDefaults({
    ...p,
    photoStatus: "real_photo",
    sizeType: i === 0 ? "nursery_container" : i === 4 ? "nursery_container" : "unknown",
    nurseryContainerSize: i === 0 ? "15 gallon" : i === 4 ? "5 gallon" : null,
    heightFeet: i === 1 ? 5 : null,
    heightInches: i === 1 ? 6 : null,
  })
);

/** Default mock plants — same as demo garden for consistency. */
export const MOCK_PLANTS = DEMO_GARDEN_PLANTS;

export const MOCK_SCAN_RESULT = {
  issue: "Yellowing Leaves",
  likelyCause: "Overwatering or poor drainage in container",
  confidence: "high" as const,
  recommendedAction:
    "Allow soil to dry completely before next watering. Check pot drainage holes and consider repotting with well-draining mix.",
};

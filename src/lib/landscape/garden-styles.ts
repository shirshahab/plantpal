import type { GardenStyle, MaintenanceLevel } from "./types";

export interface GardenStyleOption {
  id: GardenStyle;
  label: string;
  icon: string;
  description: string;
  defaultMaintenance: MaintenanceLevel;
  costRange: string;
  afterGradient: string;
}

export const GARDEN_STYLES: GardenStyleOption[] = [
  {
    id: "modern",
    label: "Modern",
    icon: "✨",
    description: "Clean lines, architectural plants, minimal palette.",
    defaultMaintenance: "low",
    costRange: "$2,500–$12,000",
    afterGradient: "from-slate-100 via-emerald-50 to-gray-200",
  },
  {
    id: "japanese",
    label: "Japanese",
    icon: "⛩️",
    description: "Maples, stone paths, moss, and calm symmetry.",
    defaultMaintenance: "moderate",
    costRange: "$3,000–$15,000",
    afterGradient: "from-emerald-100 via-teal-50 to-stone-200",
  },
  {
    id: "cottage",
    label: "Cottage",
    icon: "🏡",
    description: "Romantic borders, roses, herbs, and soft color.",
    defaultMaintenance: "moderate",
    costRange: "$1,500–$8,000",
    afterGradient: "from-rose-50 via-amber-50 to-green-100",
  },
  {
    id: "mediterranean",
    label: "Mediterranean",
    icon: "🫒",
    description: "Olive trees, lavender, terracotta, and drought-tolerant charm.",
    defaultMaintenance: "low",
    costRange: "$2,000–$10,000",
    afterGradient: "from-amber-50 via-stone-100 to-sky-50",
  },
  {
    id: "tropical",
    label: "Tropical",
    icon: "🌴",
    description: "Bold foliage, palms, and lush layered beds.",
    defaultMaintenance: "high",
    costRange: "$2,000–$10,000",
    afterGradient: "from-lime-100 via-emerald-200 to-teal-100",
  },
  {
    id: "desert",
    label: "Desert",
    icon: "🌵",
    description: "Agave, cacti, gravel mulch, sculptural minimalism.",
    defaultMaintenance: "low",
    costRange: "$1,200–$6,500",
    afterGradient: "from-amber-50 via-orange-50 to-stone-200",
  },
  {
    id: "edible_garden",
    label: "Edible Garden",
    icon: "🥬",
    description: "Raised beds, fruit trees, herbs, and harvest-first layout.",
    defaultMaintenance: "high",
    costRange: "$800–$5,000",
    afterGradient: "from-green-100 via-lime-50 to-amber-50",
  },
  {
    id: "family_friendly",
    label: "Family Friendly",
    icon: "👨‍👩‍👧",
    description: "Safe paths, durable plants, play zones, and easy upkeep.",
    defaultMaintenance: "moderate",
    costRange: "$1,500–$8,000",
    afterGradient: "from-sky-50 via-green-50 to-amber-50",
  },
  {
    id: "pollinator_garden",
    label: "Pollinator Garden",
    icon: "🦋",
    description: "Native flowers, butterfly host plants, and seasonal bloom.",
    defaultMaintenance: "moderate",
    costRange: "$800–$4,500",
    afterGradient: "from-purple-50 via-pink-50 to-green-100",
  },
];

export const GARDEN_STYLE_IDS = GARDEN_STYLES.map((s) => s.id);

export function getGardenStyleOption(id: GardenStyle): GardenStyleOption {
  return GARDEN_STYLES.find((s) => s.id === id) ?? GARDEN_STYLES[0];
}

export function normalizeGardenStyle(raw: string): GardenStyle {
  const map: Record<string, GardenStyle> = {
    modern: "modern",
    japanese: "japanese",
    japanese_garden: "japanese",
    cottage: "cottage",
    mediterranean: "mediterranean",
    tropical: "tropical",
    desert: "desert",
    native_garden: "desert",
    low_maintenance: "modern",
    edible_garden: "edible_garden",
    fruit_garden: "edible_garden",
    vegetable: "edible_garden",
    orchard: "edible_garden",
    family_friendly: "family_friendly",
    kids_family: "family_friendly",
    pollinator_garden: "pollinator_garden",
    pollinator: "pollinator_garden",
    butterfly: "pollinator_garden",
    privacy: "modern",
    outdoor_living: "modern",
    modern_luxury: "modern",
    california_native: "pollinator_garden",
  };
  return map[raw] ?? "modern";
}

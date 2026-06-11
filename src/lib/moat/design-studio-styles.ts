export type DesignStudioStyle =
  | "japanese"
  | "mediterranean"
  | "tropical"
  | "california_native"
  | "butterfly"
  | "desert"
  | "modern_luxury"
  | "vegetable"
  | "orchard";

export interface DesignStudioStyleOption {
  id: DesignStudioStyle;
  label: string;
  emoji: string;
  description: string;
  maintenance: "Low" | "Moderate" | "High";
  estCostRange: string;
}

export const DESIGN_STUDIO_STYLES: DesignStudioStyleOption[] = [
  {
    id: "japanese",
    label: "Japanese Garden",
    emoji: "⛩️",
    description: "Stone paths, maples, moss, and calm symmetry.",
    maintenance: "Moderate",
    estCostRange: "$2,500–$12,000",
  },
  {
    id: "mediterranean",
    label: "Mediterranean Garden",
    emoji: "🫒",
    description: "Lavender, olive trees, terracotta, drought-smart beds.",
    maintenance: "Low",
    estCostRange: "$1,800–$9,000",
  },
  {
    id: "tropical",
    label: "Tropical Oasis",
    emoji: "🌴",
    description: "Bold foliage, palms, bird of paradise, lush layers.",
    maintenance: "Moderate",
    estCostRange: "$2,000–$10,000",
  },
  {
    id: "california_native",
    label: "California Native Garden",
    emoji: "🌾",
    description: "Sages, manzanita, low water, pollinator-friendly.",
    maintenance: "Low",
    estCostRange: "$1,500–$7,500",
  },
  {
    id: "butterfly",
    label: "Butterfly Garden",
    emoji: "🦋",
    description: "Milkweed, nectar layers, seasonal color for pollinators.",
    maintenance: "Moderate",
    estCostRange: "$800–$4,000",
  },
  {
    id: "desert",
    label: "Desert Garden",
    emoji: "🌵",
    description: "Agave, cacti, gravel mulch, sculptural minimalism.",
    maintenance: "Low",
    estCostRange: "$1,200–$6,000",
  },
  {
    id: "modern_luxury",
    label: "Modern Luxury Garden",
    emoji: "✨",
    description: "Clean lines, architectural plants, premium hardscape.",
    maintenance: "Moderate",
    estCostRange: "$5,000–$25,000",
  },
  {
    id: "vegetable",
    label: "Vegetable Garden",
    emoji: "🥕",
    description: "Raised beds, herbs, seasonal rotation, harvest-first.",
    maintenance: "High",
    estCostRange: "$600–$3,500",
  },
  {
    id: "orchard",
    label: "Fruit Orchard",
    emoji: "🍊",
    description: "Citrus, stone fruit, espalier walls, productive canopy.",
    maintenance: "Moderate",
    estCostRange: "$2,000–$15,000",
  },
];

export interface DesignStudioConcept {
  style: DesignStudioStyle;
  title: string;
  summary: string;
  recommendedPlants: string[];
  maintenanceLevel: string;
  estimatedCost: string;
  shoppingList: { item: string; qty: string; estPrice: string }[];
  /** Placeholder for future OpenAI / DALL·E render */
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
}

export function buildMockDesignConcept(
  style: DesignStudioStyle,
  spaceLabel: string
): DesignStudioConcept {
  const opt = DESIGN_STUDIO_STYLES.find((s) => s.id === style)!;
  const plantsByStyle: Record<DesignStudioStyle, string[]> = {
    japanese: ["Japanese Maple", "Azalea", "Moss groundcover", "Bamboo screen"],
    mediterranean: ["Lavender", "Rosemary", "Olive tree", "Agapanthus"],
    tropical: ["Bird of Paradise", "Banana", "Philodendron", "Bromeliad"],
    california_native: ["California Sage", "Manzanita", "Ceanothus", "Yarrow"],
    butterfly: ["Milkweed", "Lantana", "Salvia", "Coneflower"],
    desert: ["Agave", "Red Yucca", "Desert Marigold", "Prickly Pear"],
    modern_luxury: ["Boxwood hedge", "Olive standard", "Ornamental grass", "Japanese Maple"],
    vegetable: ["Tomato", "Basil", "Pepper", "Lettuce"],
    orchard: ["Meyer Lemon", "Peach", "Plum", "Fig"],
  };

  return {
    style,
    title: `${opt.label}: ${spaceLabel}`,
    summary: `${opt.description} Tailored for your ${spaceLabel.toLowerCase()} with PlantPal's design engine.`,
    recommendedPlants: plantsByStyle[style],
    maintenanceLevel: opt.maintenance,
    estimatedCost: opt.estCostRange,
    shoppingList: plantsByStyle[style].slice(0, 4).map((p, i) => ({
      item: p,
      qty: i === 0 ? "1–2" : "3–6",
      estPrice: `$${(15 + i * 12) * 3}–$${(25 + i * 18) * 3}`,
    })),
    beforeImageUrl: null,
    afterImageUrl: null,
  };
}

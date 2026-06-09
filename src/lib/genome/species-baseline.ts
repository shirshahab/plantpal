import type { PlantSpeciesType } from "@/lib/knowledge/types";
import type { SpeciesGenomeBaseline } from "./types";

const DEFAULT_BASELINE: SpeciesGenomeBaseline = {
  id: "generic-perennial",
  commonName: "Generic Plant",
  scientificName: "Unknown species",
  type: "shrub",
  growthRate: "moderate",
  bloomMonths: [4, 5, 6],
  fruitMonths: [],
  dormantMonths: [12, 1, 2],
  repottingMonths: [3, 4],
  pruningMonths: [2, 3],
  maxHeightInches: 72,
  isFruitBearing: false,
  isFlowering: true,
  heatTolerance: "medium",
};

const BASELINES: SpeciesGenomeBaseline[] = [
  {
    id: "citrus-meyer-lemon",
    commonName: "Meyer Lemon",
    scientificName: "Citrus × meyeri",
    type: "tree",
    growthRate: "moderate",
    bloomMonths: [2, 3, 4, 5],
    fruitMonths: [11, 12, 1, 2, 3],
    dormantMonths: [12, 1],
    repottingMonths: [2, 3],
    pruningMonths: [1, 2],
    maxHeightInches: 120,
    isFruitBearing: true,
    isFlowering: true,
    heatTolerance: "high",
  },
  {
    id: "japanese-maple",
    commonName: "Japanese Maple",
    scientificName: "Acer palmatum",
    type: "tree",
    growthRate: "slow",
    bloomMonths: [3, 4],
    fruitMonths: [],
    dormantMonths: [11, 12, 1, 2],
    repottingMonths: [2, 3],
    pruningMonths: [2, 3],
    maxHeightInches: 240,
    isFruitBearing: false,
    isFlowering: true,
    heatTolerance: "low",
  },
  {
    id: "fiddle-leaf-fig",
    commonName: "Fiddle Leaf Fig",
    scientificName: "Ficus lyrata",
    type: "indoor",
    growthRate: "moderate",
    bloomMonths: [],
    fruitMonths: [],
    dormantMonths: [11, 12, 1],
    repottingMonths: [3, 4, 5],
    pruningMonths: [3, 4],
    maxHeightInches: 120,
    isFruitBearing: false,
    isFlowering: false,
    heatTolerance: "medium",
  },
  {
    id: "avocado",
    commonName: "Avocado",
    scientificName: "Persea americana",
    type: "tree",
    growthRate: "fast",
    bloomMonths: [2, 3, 4],
    fruitMonths: [6, 7, 8, 9, 10],
    dormantMonths: [12, 1],
    repottingMonths: [3, 4],
    pruningMonths: [1, 2],
    maxHeightInches: 360,
    isFruitBearing: true,
    isFlowering: true,
    heatTolerance: "high",
  },
  {
    id: "bougainvillea",
    commonName: "Bougainvillea",
    scientificName: "Bougainvillea spp.",
    type: "vine",
    growthRate: "fast",
    bloomMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    fruitMonths: [],
    dormantMonths: [12, 1],
    repottingMonths: [2, 3],
    pruningMonths: [2, 3, 8],
    maxHeightInches: 180,
    isFruitBearing: false,
    isFlowering: true,
    heatTolerance: "high",
  },
  {
    id: "tomato",
    commonName: "Tomato",
    scientificName: "Solanum lycopersicum",
    type: "vegetable",
    growthRate: "fast",
    bloomMonths: [5, 6, 7],
    fruitMonths: [6, 7, 8, 9],
    dormantMonths: [11, 12, 1, 2],
    repottingMonths: [4, 5],
    pruningMonths: [5, 6, 7],
    maxHeightInches: 72,
    isFruitBearing: true,
    isFlowering: true,
    heatTolerance: "medium",
  },
  {
    id: "succulent",
    commonName: "Succulent",
    scientificName: "Various",
    type: "succulent",
    growthRate: "slow",
    bloomMonths: [4, 5, 6],
    fruitMonths: [],
    dormantMonths: [11, 12, 1],
    repottingMonths: [3, 4],
    pruningMonths: [],
    maxHeightInches: 24,
    isFruitBearing: false,
    isFlowering: true,
    heatTolerance: "high",
  },
];

function matches(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

/** Resolve species baseline from plant name + scientific name (read-only reference). */
export function resolveSpeciesBaseline(
  plantName: string,
  species: string
): SpeciesGenomeBaseline {
  const combined = `${plantName} ${species}`;

  if (matches(combined, ["meyer", "lemon", "citrus", "c × meyeri"])) {
    return BASELINES.find((b) => b.id === "citrus-meyer-lemon")!;
  }
  if (matches(combined, ["maple", "acer"])) {
    return BASELINES.find((b) => b.id === "japanese-maple")!;
  }
  if (matches(combined, ["fiddle", "ficus lyrata", "lyrata"])) {
    return BASELINES.find((b) => b.id === "fiddle-leaf-fig")!;
  }
  if (matches(combined, ["avocado", "persea"])) {
    return BASELINES.find((b) => b.id === "avocado")!;
  }
  if (matches(combined, ["bougainvillea"])) {
    return BASELINES.find((b) => b.id === "bougainvillea")!;
  }
  if (matches(combined, ["tomato", "lycopersicum"])) {
    return BASELINES.find((b) => b.id === "tomato")!;
  }
  if (matches(combined, ["succulent", "cactus", "echeveria", "aloe"])) {
    return BASELINES.find((b) => b.id === "succulent")!;
  }

  return {
    ...DEFAULT_BASELINE,
    scientificName: species || DEFAULT_BASELINE.scientificName,
    commonName: plantName || DEFAULT_BASELINE.commonName,
    type: inferType(combined),
  };
}

function inferType(text: string): PlantSpeciesType {
  if (matches(text, ["tree", "maple", "citrus", "avocado"])) return "tree";
  if (matches(text, ["herb", "basil", "mint", "rosemary"])) return "herb";
  if (matches(text, ["tomato", "pepper", "vegetable"])) return "vegetable";
  if (matches(text, ["indoor", "fig", "monstera", "pothos"])) return "indoor";
  if (matches(text, ["succulent", "cactus"])) return "succulent";
  if (matches(text, ["vine", "bougainvillea", "ivy"])) return "vine";
  if (matches(text, ["flower", "rose", "daisy"])) return "flower";
  return "shrub";
}

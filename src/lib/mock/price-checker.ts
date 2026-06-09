import type {
  NurserySize,
  PlantPriceProfile,
  PriceCheckInput,
  PriceCheckResult,
  PriceCorrection,
  PhotoInspection,
  BuyRecommendation,
  PlantCondition,
} from "@/lib/types/price-checker";
import { PLANT_PRICE_PROFILES } from "./price-checker-data";

const TYPO_CORRECTIONS: Record<string, string> = {
  lemmon: "lemon",
  avacado: "avocado",
  avacodo: "avocado",
  japenese: "japanese",
  japaneese: "japanese",
  bouganvilla: "bougainvillea",
  bougainvillia: "bougainvillea",
  hydranga: "hydrangea",
  lavendar: "lavender",
  pomagranate: "pomegranate",
  pomgranate: "pomegranate",
  monestera: "monstera",
  fidde: "fiddle",
  blank: "hass",
};

const PLANT_ALIASES: Record<string, string> = {
  "blank avocado": "hass-avocado",
  "avocado tree": "hass-avocado",
  avocado: "hass-avocado",
  "meyer lemon": "meyer-lemon",
  "lemon tree": "meyer-lemon",
  lemon: "meyer-lemon",
  "lime tree": "lime-tree",
  "key lime": "lime-tree",
  "orange tree": "orange-tree",
  "olive tree": "olive-tree",
  "japanese maple": "japanese-maple",
  bougainvillea: "bougainvillea",
  "fiddle leaf fig": "fiddle-leaf-fig",
  fiddle: "fiddle-leaf-fig",
  monstera: "monstera",
  "snake plant": "snake-plant",
  "aloe vera": "aloe-vera",
  aloe: "aloe-vera",
  lavender: "lavender",
  rosemary: "rosemary",
  hydrangea: "hydrangea",
  rose: "rose",
  magnolia: "magnolia",
  "crape myrtle": "crape-myrtle",
  crepe: "crape-myrtle",
  pomegranate: "pomegranate",
  "fig tree": "fig-tree",
  fig: "fig-tree",
  "bird of paradise": "bird-of-paradise",
  "hass avocado": "hass-avocado",
};

const SIZE_ORDER: NurserySize[] = [
  "4 inch",
  "1 gallon",
  "2 gallon",
  "3 gallon",
  "5 gallon",
  "7 gallon",
  "10 gallon",
  "15 gallon",
  "24 inch box",
  "36 inch box",
];

function normalizeText(input: string): string {
  let text = input.toLowerCase().trim();
  for (const [typo, fix] of Object.entries(TYPO_CORRECTIONS)) {
    text = text.replace(new RegExp(`\\b${typo}\\b`, "gi"), fix);
  }
  return text.replace(/\s+/g, " ");
}

function detectCorrection(original: string, normalized: string, matched: PlantPriceProfile): PriceCorrection | null {
  const orig = original.toLowerCase().trim();
  if (orig.includes("blank") && matched.id === "hass-avocado") {
    return {
      original,
      corrected: matched.displayName,
      suggestion: "Did you mean Hass avocado?",
    };
  }
  if (orig !== normalized && orig !== matched.displayName.toLowerCase()) {
    return { original, corrected: matched.displayName };
  }
  if (normalized !== orig) {
    return { original, corrected: matched.displayName };
  }
  return null;
}

function matchProfile(query: string): PlantPriceProfile {
  const normalized = normalizeText(query);

  const sortedAliases = Object.entries(PLANT_ALIASES).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [alias, profileId] of sortedAliases) {
    if (normalized.includes(alias)) {
      const found = PLANT_PRICE_PROFILES.find((p) => p.id === profileId);
      if (found) return found;
    }
  }

  for (const profile of PLANT_PRICE_PROFILES) {
    if (normalized.includes(profile.id.replace(/-/g, " "))) return profile;
    for (const alias of profile.aliases) {
      if (normalized.includes(alias.toLowerCase())) return profile;
    }
  }

  const words = normalized.split(" ");
  for (const profile of PLANT_PRICE_PROFILES) {
    if (words.some((w) => profile.aliases.some((a) => a.includes(w) && w.length > 3))) {
      return profile;
    }
  }

  return PLANT_PRICE_PROFILES[0];
}

function resolvePricing(profile: PlantPriceProfile, size: NurserySize) {
  if (profile.sizes[size]) return profile.sizes[size]!;

  const available = SIZE_ORDER.filter((s) => profile.sizes[s]);
  if (available.length === 0) return profile.sizes["3 gallon"]!;

  const idx = SIZE_ORDER.indexOf(size);
  let closest = available[0]!;
  let minDiff = Math.abs(SIZE_ORDER.indexOf(closest) - idx);

  for (const s of available) {
    const diff = Math.abs(SIZE_ORDER.indexOf(s) - idx);
    if (diff < minDiff) {
      minDiff = diff;
      closest = s;
    }
  }

  const base = profile.sizes[closest]!;
  const scale = idx >= 0 ? 1 + (idx - SIZE_ORDER.indexOf(closest)) * 0.35 : 1;

  return {
    bigBoxRange: [Math.round(base.bigBoxRange[0] * scale), Math.round(base.bigBoxRange[1] * scale)] as [number, number],
    nurseryRange: [Math.round(base.nurseryRange[0] * scale), Math.round(base.nurseryRange[1] * scale)] as [number, number],
    onlineRange: [Math.round(base.onlineRange[0] * scale), Math.round(base.onlineRange[1] * scale)] as [number, number],
    premiumRange: [Math.round(base.premiumRange[0] * scale), Math.round(base.premiumRange[1] * scale)] as [number, number],
    buyUnderPrice: Math.round(base.buyUnderPrice * scale),
    overpricedAbove: Math.round(base.overpricedAbove * scale),
  };
}

function formatRange([lo, hi]: [number, number], suffix = ""): string {
  return `$${lo} to $${hi}${suffix}`;
}

function getRecommendation(
  pricing: { buyUnderPrice: number; overpricedAbove: number },
  condition: PlantCondition
): { recommendation: BuyRecommendation; text: string } {
  if (condition === "wilting" || condition === "root_bound") {
    return {
      recommendation: "Needs Inspection",
      text: "Inspect roots and overall health in person before buying — condition flags reduce value.",
    };
  }
  if (condition === "yellow_leaves") {
    return {
      recommendation: "Pass",
      text: "Yellow leaves at purchase often mean stress. Only buy at a steep discount with a return policy.",
    };
  }
  return {
    recommendation: "Good Buy",
    text: `Good buy if under $${pricing.buyUnderPrice} and the plant is healthy. Overpriced above $${pricing.overpricedAbove} unless grafted, disease-free, and well-shaped.`,
  };
}

function mockPhotoInspection(): PhotoInspection {
  return {
    visibleLeaves: "healthy",
    structure: "acceptable",
    risk: "medium",
    recommendation: "Inspect roots before buying — photo inspection is limited.",
    comingSoon: true,
  };
}

export function checkPlantPrice(input: PriceCheckInput): PriceCheckResult {
  const normalizedQuery = normalizeText(input.plantName);
  const profile = matchProfile(input.plantName);
  const correction = detectCorrection(input.plantName, normalizedQuery, profile);
  const pricing = resolvePricing(profile, input.size);

  const fairLo = pricing.nurseryRange[0];
  const fairHi = pricing.nurseryRange[1];
  const budgetHi = pricing.bigBoxRange[0];
  const expensiveLo = pricing.overpricedAbove;
  const premiumLo = pricing.premiumRange[0];

  const { recommendation, text: recommendationText } = getRecommendation(pricing, input.condition);

  const verdict =
    input.condition === "healthy"
      ? `Fair buy if under $${pricing.buyUnderPrice} and the tree is healthy. Overpriced above $${pricing.overpricedAbove} unless premium quality.`
      : `Price may look fair, but plant condition (${input.condition.replace("_", " ")}) should lower what you pay.`;

  return {
    correctedName: profile.displayName,
    displayQuery: `${profile.displayName}, ${input.size}`,
    correction,
    profile,
    size: input.size,
    pricing,
    fairRange: [fairLo, fairHi],
    verdict,
    tiers: [
      { label: "Budget", range: `Under $${budgetHi}`, description: "Big box / sale pricing" },
      { label: "Fair", range: `$${fairLo} to $${fairHi}`, description: "Typical local nursery range" },
      { label: "Expensive", range: `$${expensiveLo} to $${premiumLo - 1}`, description: "Above average — needs justification" },
      { label: "Premium", range: `$${premiumLo}+`, description: "Specimen / specialty nursery" },
    ],
    bigBoxLabel: formatRange(pricing.bigBoxRange),
    nurseryLabel: formatRange(pricing.nurseryRange),
    premiumLabel: formatRange(pricing.premiumRange),
    onlineLabel: `${formatRange(pricing.onlineRange)} plus shipping`,
    recommendation,
    recommendationText,
    checklist: profile.checklist,
    redFlags: profile.redFlags,
    alternatives: profile.alternatives,
    regionalNotes: profile.regionalNotes,
    photoInspection: input.hasPhoto ? mockPhotoInspection() : null,
    lessonId: "buy-healthy-nursery-plant",
  };
}

export { PLANT_PRICE_PROFILES };

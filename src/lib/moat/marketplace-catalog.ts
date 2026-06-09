import type { ProductRecommendation } from "@/lib/marketplace/types";
import { MOCK_PRODUCTS } from "@/lib/marketplace/mock-products";

export type MarketplaceCategory =
  | "plants"
  | "soil"
  | "fertilizer"
  | "pots"
  | "tools"
  | "irrigation"
  | "pest_control";

export const MARKETPLACE_CATEGORIES: {
  id: MarketplaceCategory;
  label: string;
  emoji: string;
}[] = [
  { id: "plants", label: "Plants", emoji: "🌿" },
  { id: "soil", label: "Soil", emoji: "🪴" },
  { id: "fertilizer", label: "Fertilizer", emoji: "🧪" },
  { id: "pots", label: "Pots", emoji: "🏺" },
  { id: "tools", label: "Tools", emoji: "🔧" },
  { id: "irrigation", label: "Irrigation", emoji: "💧" },
  { id: "pest_control", label: "Pest Control", emoji: "🐛" },
];

export type AffiliateSource = "amazon" | "home_depot" | "local_nursery" | "serpapi";

export interface MarketplaceProduct extends ProductRecommendation {
  affiliateSource?: AffiliateSource;
  affiliateUrl?: string;
  inStock?: boolean;
}

const EXTRA_MOCK: MarketplaceProduct[] = [
  {
    id: "prod-drip-kit",
    name: "Adjustable Drip Irrigation Kit",
    category: "irrigation",
    description: "20-plant drip system with timer-ready manifold.",
    bestFor: "Raised beds, orchard rows, vacation watering",
    priceRange: "$35–$65",
    whyItFits: "Consistent moisture improves citrus and vegetable yields.",
    whatToAvoid: "Cheap kits without pressure regulators",
    affiliateSource: "home_depot",
    affiliateUrl: "https://www.homedepot.com/",
    inStock: true,
  },
  {
    id: "prod-pruners",
    name: "Bypass Pruning Shears (8\")",
    category: "pruning_tools",
    description: "Sharp bypass cutters for roses and fruit trees.",
    bestFor: "Deadheading, shaping, clean cuts",
    priceRange: "$18–$35",
    whyItFits: "Essential for rose beds and citrus canopy management.",
    whatToAvoid: "Anvil pruners that crush stems",
    affiliateSource: "amazon",
    affiliateUrl: "https://www.amazon.com/",
    inStock: true,
  },
  {
    id: "prod-terra-pot",
    name: "Terracotta Planter (14\")",
    category: "pots",
    description: "Breathable classic pot for Mediterranean herbs.",
    bestFor: "Lavender, rosemary, indoor monstera",
    priceRange: "$12–$28",
    whyItFits: "Porosity prevents root rot for herbs and indoor tropicals.",
    whatToAvoid: "Glazed pots without drainage holes",
    affiliateSource: "local_nursery",
    inStock: true,
  },
  {
    id: "prod-neem",
    name: "Neem Oil Spray (Ready-to-use)",
    category: "pest_control",
    description: "Organic aphid and mildew control for edibles and ornamentals.",
    bestFor: "Aphids on roses, citrus leaf miner prevention",
    priceRange: "$10–$16",
    whyItFits: "Safer option when you spot pests during seasonal checks.",
    whatToAvoid: "Applying in direct hot sun on stressed plants",
    affiliateSource: "amazon",
    inStock: true,
  },
];

export const ALL_MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  ...(MOCK_PRODUCTS as MarketplaceProduct[]),
  ...EXTRA_MOCK,
];

export interface PlantProductRule {
  plantPattern: RegExp;
  productIds: string[];
  reason: string;
}

export const PLANT_PRODUCT_RULES: PlantProductRule[] = [
  {
    plantPattern: /citrus|lemon|orange|lime|grapefruit/i,
    productIds: ["prod-meyer-lemon", "prod-citrus-soil", "prod-citrus-fert"],
    reason: "Because you own citrus trees",
  },
  {
    plantPattern: /rose/i,
    productIds: ["prod-lavender", "prod-pruners"],
    reason: "Because you own roses",
  },
  {
    plantPattern: /monstera|philodendron|indoor/i,
    productIds: ["prod-terra-pot"],
    reason: "For your indoor collection",
  },
  {
    plantPattern: /tomato|pepper|vegetable|lettuce/i,
    productIds: ["prod-raised-bed-mix", "prod-drip-kit"],
    reason: "For your edible garden",
  },
];

export function getRecommendedProducts(plantLabels: string[]): MarketplaceProduct[] {
  const ids = new Set<string>();
  for (const label of plantLabels) {
    for (const rule of PLANT_PRODUCT_RULES) {
      if (rule.plantPattern.test(label)) {
        rule.productIds.forEach((id) => ids.add(id));
      }
    }
  }
  return ALL_MARKETPLACE_PRODUCTS.filter((p) => ids.has(p.id));
}

export function productsByCategory(category: MarketplaceCategory): MarketplaceProduct[] {
  return ALL_MARKETPLACE_PRODUCTS.filter((p) => p.category === category);
}

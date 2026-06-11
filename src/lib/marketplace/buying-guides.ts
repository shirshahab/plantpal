import type { BuyingGuideDetail, ProductRecommendation } from "./types";
import { getProductById } from "./mock-products";

export const BUYING_GUIDES: BuyingGuideDetail[] = [
  {
    id: "guide-fruit-trees-zip",
    slug: "fruit-trees-zip",
    title: "Best fruit trees for your ZIP code",
    description: "Climate-matched citrus, stone fruit, and avocados for home orchards.",
    icon: "🍊",
    zipAware: true,
    intro:
      "Fruit tree success starts with USDA zone and chill hours. In Southern California (zones 9–10), citrus and avocados dominate; stone fruit needs low-chill varieties.",
    picks: ["Meyer lemon", "Hass avocado", "Fuerte avocado (pollinator)", "Peach (low-chill)", "Fig"],
    productIds: ["prod-meyer-lemon", "prod-hass-avocado", "prod-citrus-soil", "prod-citrus-fert"],
    plantPicks: [
      { name: "Meyer Lemon", why: "Compact, productive, zones 8–11. Ideal patio tree.", zone: "8–11" },
      { name: "Hass Avocado", why: "Best home-garden avocado in frost-free areas.", zone: "9–11" },
      { name: "Brown Turkey Fig", why: "Forgiving, handles heat, fruits twice in warm climates.", zone: "7–10" },
    ],
  },
  {
    id: "guide-low-maintenance",
    slug: "low-maintenance",
    title: "Best low-maintenance plants",
    description: "Plants that forgive missed waterings and need minimal pruning.",
    icon: "🌵",
    intro:
      "Low maintenance does not mean zero care. It means plants that tolerate irregular attention and local climate without constant intervention.",
    picks: ["Lavender", "Rosemary", "Snake plant", "Olive (dwarf)", "Agave (accent)"],
    productIds: ["prod-lavender", "prod-snake-plant", "prod-drip-kit"],
    plantPicks: [
      { name: "Lavender", why: "Drought-tolerant once established; full sun.", zone: "5–10" },
      { name: "Rosemary", why: "Edible, aromatic, handles heat and poor soil.", zone: "7–10" },
      { name: "Snake Plant", why: "Indoor champion. Water monthly in winter.", zone: "Indoor" },
    ],
  },
  {
    id: "guide-full-sun",
    slug: "full-sun",
    title: "Best plants for full sun",
    description: "Heat-tolerant picks for 6+ hours of direct light.",
    icon: "☀️",
    intro:
      "Full sun means 6+ hours of direct light. These plants handle afternoon heat in Mediterranean and desert-influenced climates.",
    picks: ["Meyer lemon", "Lavender", "Rosemary", "Bougainvillea", "Crape myrtle"],
    productIds: ["prod-meyer-lemon", "prod-lavender", "prod-drip-kit"],
    plantPicks: [
      { name: "Bougainvillea", why: "Explosive color; thrives on heat and neglect.", zone: "9–11" },
      { name: "Rosemary", why: "Aromatic hedge or specimen in blazing sun.", zone: "7–10" },
      { name: "Meyer Lemon", why: "Fruit + structure; needs deep watering in heat.", zone: "8–11" },
    ],
  },
  {
    id: "guide-shade",
    slug: "shade",
    title: "Best plants for shade",
    description: "Understory and north-side plants for limited direct sun.",
    icon: "🌿",
    intro:
      "Shade does not mean dark. Most 'shade' plants want bright indirect light or morning sun. Match plants to hours of direct exposure.",
    picks: ["Hosta", "Ferns", "Japanese maple", "Hydrangea", "Snake plant (low light)"],
    productIds: ["prod-shade-hosta", "prod-snake-plant"],
    plantPicks: [
      { name: "Hosta", why: "Reliable foliage color in full shade beds.", zone: "3–9" },
      { name: "Japanese Maple", why: "Filtered light protects delicate leaves.", zone: "5–8" },
      { name: "Hydrangea", why: "Morning sun, afternoon shade ideal.", zone: "6–9" },
    ],
  },
  {
    id: "guide-citrus-soil",
    slug: "citrus-soil",
    title: "Best soil for citrus",
    description: "Drainage-first mixes for containers and in-ground planting.",
    icon: "🪴",
    intro:
      "Citrus roots hate wet feet. Use fast-draining, slightly acidic mix, never heavy clay or moisture-retaining lawn soil.",
    picks: ["Citrus planting mix", "Perlite amendment", "Pumice top-dress"],
    productIds: ["prod-citrus-soil", "prod-air-pot"],
    plantPicks: [],
  },
  {
    id: "guide-avocado-fertilizer",
    slug: "avocado-fertilizer",
    title: "Best fertilizer for avocado",
    description: "Feeding schedules and formulas for Hass and Fuerte trees.",
    icon: "🥑",
    intro:
      "Avocados need nitrogen plus micronutrients (zinc, manganese). Feed lightly and often during active growth, not when stressed or dry.",
    picks: ["Avocado-specific granular", "Liquid kelp supplement", "Compost top-dress"],
    productIds: ["prod-avocado-fert", "prod-citrus-fert"],
    plantPicks: [],
  },
  {
    id: "guide-bonsai-tools",
    slug: "bonsai-tools",
    title: "Best beginner bonsai tools",
    description: "Starter tool kit for your first wired tree.",
    icon: "🎋",
    intro:
      "Three tools cover 90% of beginner bonsai work: concave cutter, knob cutter, and leaf scissors. Quality beats quantity.",
    picks: ["Concave branch cutter", "Knob cutter", "Leaf scissors", "Aluminum wire set"],
    productIds: ["prod-bonsai-shears", "prod-bonsai-wire", "prod-felco-pruner"],
    plantPicks: [],
  },
];

export function getBuyingGuide(slug: string): BuyingGuideDetail | undefined {
  return BUYING_GUIDES.find((g) => g.slug === slug || g.id === slug);
}

function guideMatchesQuery(guide: BuyingGuideDetail, q: string): boolean {
  if (guide.picks.some((pick) => q.includes(pick.toLowerCase()) || pick.toLowerCase().includes(q))) {
    return true;
  }
  if (guide.plantPicks?.some((p) => q.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(q))) {
    return true;
  }
  return guide.title.toLowerCase().includes(q) || guide.slug.replace(/-/g, " ").includes(q);
}

function productsFromGuide(guide: BuyingGuideDetail, limit: number): ProductRecommendation[] {
  return guide.productIds
    .map((id) => getProductById(id))
    .filter((p): p is ProductRecommendation => !!p)
    .slice(0, limit);
}

export function getRelatedProductsForPlant(
  plantQuery: string,
  limit = 3
): { guide?: BuyingGuideDetail; products: ProductRecommendation[] } {
  const q = plantQuery.toLowerCase().trim();
  if (!q) {
    return { products: [] };
  }

  for (const guide of BUYING_GUIDES) {
    if (guideMatchesQuery(guide, q)) {
      return { guide, products: productsFromGuide(guide, limit) };
    }
  }

  if (q.includes("avocado")) {
    const guide = getBuyingGuide("avocado-fertilizer");
    return guide ? { guide, products: productsFromGuide(guide, limit) } : { products: [] };
  }
  if (/(citrus|lemon|lime|orange|grapefruit)/.test(q)) {
    const guide = getBuyingGuide("citrus-soil");
    return guide ? { guide, products: productsFromGuide(guide, limit) } : { products: [] };
  }
  if (q.includes("bonsai")) {
    const guide = getBuyingGuide("bonsai-tools");
    return guide ? { guide, products: productsFromGuide(guide, limit) } : { products: [] };
  }
  if (/(shade|hosta|fern|maple)/.test(q)) {
    const guide = getBuyingGuide("shade");
    return guide ? { guide, products: productsFromGuide(guide, limit) } : { products: [] };
  }

  const guide = BUYING_GUIDES[0];
  return { guide, products: productsFromGuide(guide, limit) };
}

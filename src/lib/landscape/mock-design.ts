import type {
  AfterConcept,
  GardenStyle,
  LandscapeDesignRequest,
  LandscapeDesignResponse,
  LandscapePlantListItem,
  StyleGoal,
} from "./types";
import { BUDGET_RANGE_LABELS, SPACE_TYPE_LABELS, YARD_SIZE_LABELS } from "./types";
import { getGardenStyleOption } from "./garden-styles";
import { enrichPlantListWithSuitability } from "./enrich-plants";
import { lookupZipRecord } from "@/lib/location/usda-zones";

function seasonNote(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4)
    return "Spring planting window. Ideal for new shrubs and ground cover.";
  if (month >= 5 && month <= 7)
    return "Summer heat. Prioritize drought-tolerant choices and irrigation.";
  if (month >= 8 && month <= 10)
    return "Fall is excellent for trees and climate-native planting.";
  return "Winter dormancy. Plan structure; plant bare-root trees where appropriate.";
}

type SpaceType = LandscapeDesignRequest["spaceType"];

const SPACE_DEFAULTS: Record<
  SpaceType,
  { sqFt: string; dims: string; plants: string[] }
> = {
  front_yard: {
    sqFt: "800–1,200 sq ft",
    dims: "Approx. 25×35 ft visible from street",
    plants: ["Existing lawn", "Mature street tree (possibly)"],
  },
  back_yard: {
    sqFt: "400–900 sq ft",
    dims: "Approx. 20×30 ft usable planting area",
    plants: ["Fence-line shrubs", "Patio-adjacent pots"],
  },
  side_yard: {
    sqFt: "80–200 sq ft",
    dims: "Narrow strip approx. 4×25 ft",
    plants: ["Utility access path", "Possible vine on fence"],
  },
  patio: {
    sqFt: "120–250 sq ft",
    dims: "Paved patio approx. 12×18 ft with perimeter beds",
    plants: ["Container citrus", "Potted herbs"],
  },
  balcony: {
    sqFt: "40–80 sq ft",
    dims: "Rail planters + 2–3 large containers",
    plants: ["Small pots", "Herbs or succulents"],
  },
  slope: {
    sqFt: "200–600 sq ft",
    dims: "Sloped grade approx. 15–30% incline",
    plants: ["Erosion-prone bare soil", "Scattered weeds or grass"],
  },
};

const STYLE_PLANTS: Record<
  StyleGoal,
  { trees: string[]; shrubs: string[]; flowers: string[]; ground_cover: string[] }
> = {
  modern: {
    trees: ["Multi-stem birch", "Olive standard (dwarf)"],
    shrubs: ["Boxwood hedge", "Ornamental grass (Miscanthus)", "Agave accent"],
    flowers: ["Minimal: structural green focus"],
    ground_cover: ["Decomposed granite", "Black mulch beds"],
  },
  japanese: {
    trees: ["Japanese maple", "Weeping cherry"],
    shrubs: ["Azalea", "Nandina", "Boxwood (sheared)"],
    flowers: ["Japanese iris (seasonal)", "Camellia"],
    ground_cover: ["Moss patches", "Fine gravel raked paths"],
  },
  cottage: {
    trees: ["Crabapple", "Dogwood"],
    shrubs: ["Hydrangea", "Rose bush", "Lavender"],
    flowers: ["Delphinium", "Foxglove", "Catmint"],
    ground_cover: ["Creeping thyme", "Strawberry ground cover"],
  },
  tropical: {
    trees: ["Banana (ornamental)", "Bird of paradise"],
    shrubs: ["Hibiscus", "Plumeria (container in cold zones)"],
    flowers: ["Bromeliads", "Canna lily"],
    ground_cover: ["Liriope", "Sweet potato vine (seasonal)"],
  },
  desert: {
    trees: ["Desert willow", "Palo verde (where hardy)"],
    shrubs: ["Agave", "Red yucca", "Brittlebush"],
    flowers: ["Desert marigold", "Penstemon (native)"],
    ground_cover: ["Gravel mulch", "Dymondia", "Decomposed granite"],
  },
  edible_garden: {
    trees: ["Meyer lemon", "Fig (Brown Turkey)", "Dwarf peach"],
    shrubs: ["Blueberry", "Pomegranate", "Rosemary hedge"],
    flowers: ["Marigolds (companion)", "Nasturtium"],
    ground_cover: ["Strawberry runners", "Creeping thyme between paths"],
  },
  mediterranean: {
    trees: ["Olive (dwarf)", "Italian cypress (where hardy)"],
    shrubs: ["Lavender", "Rosemary", "Santolina"],
    flowers: ["Society garlic", "Catmint"],
    ground_cover: ["Dymondia", "Decomposed granite paths"],
  },
  family_friendly: {
    trees: ["Crabapple", "Serviceberry"],
    shrubs: ["Hydrangea", "Spirea", "Boxwood (soft hedge)"],
    flowers: ["Sunflowers", "Zinnias", "Marigolds"],
    ground_cover: ["Clover lawn patch", "Straw mulch play border"],
  },
  pollinator_garden: {
    trees: ["Eastern redbud", "Chokecherry (native)"],
    shrubs: ["Butterfly bush ( sterile cultivar)", "Ninebark", "Viburnum"],
    flowers: ["Coneflower", "Black-eyed Susan", "Milkweed"],
    ground_cover: ["Creeping phlox", "Native sedge mix"],
  },
};

const AFTER_CHANGES: Record<StyleGoal, string[]> = {
  modern: [
    "Replace scattered lawn with geometric gravel beds",
    "Add architectural evergreens along sight lines",
    "Install linear drip irrigation and dark mulch",
  ],
  japanese: [
    "Add curved stone path and raked gravel zone",
    "Layer maples for height with low moss groundcover",
    "Frame focal tree with pruned shrubs",
  ],
  cottage: [
    "Soft curved beds with mixed height perennials",
    "Add picket or natural stone edging",
    "Layer roses, herbs, and seasonal color at entry",
  ],
  tropical: [
    "Bold layered foliage along fence and patio",
    "Add palms or banana as vertical anchors",
    "Rich mulch and regular drip zones for lush look",
  ],
  desert: [
    "Replace thirsty lawn with gravel and sculptural succulents",
    "Group agave and yucca on berms for drainage",
    "Minimal irrigation: deep soak zones only",
  ],
  edible_garden: [
    "Install raised beds along sunniest edge",
    "Add espalier fruit on fence line",
    "Herb strip near kitchen or patio access",
  ],
  mediterranean: [
    "Replace lawn with gravel and terracotta accents",
    "Plant olive and lavender in sunniest zones",
    "Add decomposed granite paths between beds",
  ],
  family_friendly: [
    "Define soft-edged play zone with durable ground cover",
    "Add wide paths for strollers and bikes",
    "Choose non-toxic, thorn-free plants near activity areas",
  ],
  pollinator_garden: [
    "Layer native flowers for spring-through-fall bloom",
    "Add shallow water feature or bird bath edge",
    "Group milkweed and nectar plants in sunny clusters",
  ],
};

function buildPlantList(
  style: StyleGoal,
  rec: LandscapeDesignResponse["recommendations"]
): LandscapePlantListItem[] {
  const items: LandscapePlantListItem[] = [];
  rec.trees.forEach((name, i) =>
    items.push({
      name,
      category: "tree",
      quantity: i === 0 ? "1–2" : "1",
      est_price: i === 0 ? "$45–$180" : "$35–$120",
    })
  );
  rec.shrubs.slice(0, 4).forEach((name) =>
    items.push({ name, category: "shrub", quantity: "2–6", est_price: "$12–$45 each" })
  );
  rec.flowers.slice(0, 3).forEach((name) =>
    items.push({ name, category: "flower", quantity: "6–12", est_price: "$4–$8 each" })
  );
  rec.ground_cover.slice(0, 2).forEach((name) =>
    items.push({ name, category: "ground_cover", quantity: "1 flat–3 bags", est_price: "$25–$80" })
  );
  if (style === "edible_garden") {
    items.push({
      name: "Raised bed kit (4×8 ft)",
      category: "edible",
      quantity: "1–2",
      est_price: "$120–$280",
    });
  }
  return items;
}

function yardSizeMultiplier(size: LandscapeDesignRequest["yardSize"]): {
  costFactor: number;
  sqOverride?: string;
} {
  switch (size) {
    case "small":
      return { costFactor: 0.5, sqOverride: "200–500 sq ft" };
    case "medium":
      return { costFactor: 1 };
    case "large":
      return { costFactor: 1.8, sqOverride: "2,000–5,000+ sq ft" };
    default:
      return { costFactor: 1 };
  }
}

function formatCostRange(base: string, factor: number): string {
  if (factor === 1) return base;
  if (base.includes("–")) {
    const [lo, hi] = base.replace(/\$/g, "").split("–");
    const loNum = parseInt(lo.replace(/[^\d]/g, ""), 10);
    const hiNum = parseInt(hi.replace(/[^\d]/g, ""), 10);
    if (!isNaN(loNum) && !isNaN(hiNum)) {
      return `$${Math.round(loNum * factor).toLocaleString()}–$${Math.round(hiNum * factor).toLocaleString()}`;
    }
  }
  return base;
}

export function mockLandscapeDesign(
  req: LandscapeDesignRequest
): LandscapeDesignResponse {
  const record = lookupZipRecord(req.zipCode);
  const defaults = SPACE_DEFAULTS[req.spaceType];
  const styleOpt = getGardenStyleOption(req.styleGoal);
  const stylePlants = STYLE_PLANTS[req.styleGoal];
  const isSmall =
    req.spaceType === "balcony" ||
    req.spaceType === "patio" ||
    req.yardSize === "small";
  const isSlope = req.spaceType === "slope";
  const { costFactor, sqOverride } = yardSizeMultiplier(req.yardSize);

  const trees = isSmall
    ? stylePlants.trees.slice(0, 2).map((t) => `${t} (container)`)
    : stylePlants.trees;

  const recommendations = {
    trees,
    shrubs: stylePlants.shrubs,
    flowers: stylePlants.flowers,
    ground_cover: isSlope
      ? ["Creeping rosemary (erosion control)", ...stylePlants.ground_cover.slice(0, 2)]
      : stylePlants.ground_cover,
  };

  const maintenance = styleOpt.defaultMaintenance;

  const soilPrep = isSlope
    ? "Terrace steep sections with retaining timbers or boulders; amend planting pockets with compost."
    : isSmall
      ? "Refresh container mix; ensure drainage holes; top-dress beds with 2 in. compost."
      : "Remove weeds, loosen soil 8–12 in., incorporate 3 in. compost, grade for drainage.";

  const budgetBase = isSmall
    ? { budget: "$150–400", balanced: "$400–900", premium: "$900–2,000" }
    : { budget: "$800–2,500", balanced: "$2,500–8,000", premium: "$8,000–25,000+" };

  const afterConcept: AfterConcept = {
    headline: `${styleOpt.label} transformation`,
    description: `Your ${SPACE_TYPE_LABELS[req.spaceType].toLowerCase()} reimagined as a ${styleOpt.label.toLowerCase()} garden: ${styleOpt.description.toLowerCase()} Plants are selected for Zone ${record.usdaZone} and ${record.climateType} climate.`,
    key_changes: AFTER_CHANGES[req.styleGoal],
    accent_color: styleOpt.afterGradient.split(" ")[1]?.replace("via-", "") ?? "green-100",
  };

  const response: LandscapeDesignResponse = {
    analysis: {
      space_type: req.spaceType,
      estimated_sq_ft: sqOverride ?? defaults.sqFt,
      estimated_dimensions: defaults.dims,
      existing_plants: defaults.plants,
      sunlight: req.sunExposure,
      sunlight_notes:
        req.sunExposure === "full_sun"
          ? "Open exposure: 6+ hours direct sun expected."
          : req.sunExposure === "shade"
            ? "Limited direct sun. Shade-tolerant plants prioritized."
            : "Mixed light. Zone plants by microclimate.",
      site_notes:
        req.notes?.trim() ||
        `${styleOpt.label} layout · ${YARD_SIZE_LABELS[req.yardSize].toLowerCase()}.`,
    },
    climate: {
      zip_code: req.zipCode,
      city: record.city,
      usda_zone: record.usdaZone,
      climate_type: record.climateType,
      season_note: seasonNote(),
    },
    recommendations,
    irrigation: {
      approach: isSmall
        ? "Drip to containers + hand-watering backup"
        : "Smart drip zones by hydrozone",
      notes: "Mulch all beds 2–3 inches to retain moisture.",
    },
    soil_prep: soilPrep,
    maintenance_level: maintenance,
    maintenance_notes:
      maintenance === "low"
        ? "Seasonal pruning and mulch refresh."
        : maintenance === "high"
          ? "Regular shaping, seasonal planting, attentive watering."
          : "Monthly check-ins and seasonal pruning.",
    estimated_budget: styleOpt.costRange,
    first_steps: [
      "Clear weeds and mark utility lines.",
      "Lay out beds and paths.",
      `Source Zone ${record.usdaZone} plants.`,
      "Install drip before mulching.",
    ],
    budget_options: [
      {
        tier: "budget",
        label: "Budget Plan",
        estimated_cost: formatCostRange(budgetBase.budget, costFactor),
        summary: "Starter plants, mulch, basic drip. DIY weekend install.",
        plant_list: recommendations.trees.slice(0, 1).concat(recommendations.shrubs.slice(0, 2)),
        highlights: ["Big-box nursery", "Mulch-heavy beds"],
      },
      {
        tier: "balanced",
        label: "Balanced Plan",
        estimated_cost: formatCostRange(budgetBase.balanced, costFactor),
        summary: "Quality nursery stock, zoned drip, layered structure.",
        plant_list: [
          ...recommendations.trees,
          ...recommendations.shrubs.slice(0, 3),
        ],
        highlights: [styleOpt.label, "Smart timer"],
      },
      {
        tier: "premium",
        label: "Premium Plan",
        estimated_cost: formatCostRange(budgetBase.premium, costFactor),
        summary: "Mature specimens, pro irrigation, designer layout.",
        plant_list: [
          ...recommendations.trees,
          ...recommendations.shrubs,
          ...recommendations.flowers.slice(0, 2),
        ],
        highlights: ["Instant impact", "Pro install"],
      },
    ],
    design_summary: `${styleOpt.label} concept for your ${SPACE_TYPE_LABELS[req.spaceType].toLowerCase()} in ${record.city} (Zone ${record.usdaZone}). ${seasonNote()}`,
    layout_suggestions: [
      "Anchor tall trees at corners or fence lines for structure.",
      "Place thirstiest plants near the hose bib or drip manifold.",
      "Leave circulation paths 3–4 ft wide for maintenance access.",
    ],
    phased_plan: [
      {
        phase: 1,
        title: "Site prep & layout",
        timeframe: "Weeks 1–2",
        tasks: ["Remove weeds", "Mark beds and paths", "Soil amendment"],
        estimated_cost: formatCostRange("$300–$800", costFactor),
      },
      {
        phase: 2,
        title: "Hardscape & irrigation",
        timeframe: "Weeks 3–5",
        tasks: ["Install drip zones", "Lay paths or edging", "Mulch beds"],
        estimated_cost: formatCostRange("$800–$2,500", costFactor),
      },
      {
        phase: 3,
        title: "Planting & finish",
        timeframe: "Weeks 6–8",
        tasks: ["Plant trees and shrubs", "Add ground cover", "Final mulch layer"],
        estimated_cost: formatCostRange(budgetBase.balanced, costFactor),
      },
    ],
    after_concept: afterConcept,
    after_image_url: null,
    plant_list: enrichPlantListWithSuitability(
      buildPlantList(req.styleGoal, recommendations),
      req.zipCode,
      req.sunExposure
    ),
    maintenance_score:
      maintenance === "low" ? 88 : maintenance === "high" ? 42 : 65,
    source: "mock",
  };

  return response;
}

import type {
  LandscapeDesignRequest,
  LandscapeDesignResponse,
  SpaceAnalysis,
  StyleGoal,
} from "./types";
import {
  BUDGET_RANGE_LABELS,
  SPACE_TYPE_LABELS,
  STYLE_GOAL_LABELS,
  YARD_SIZE_LABELS,
} from "./types";
import { lookupZipRecord } from "@/lib/location/usda-zones";

function seasonNote(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4)
    return "Spring planting window — ideal for new shrubs and ground cover.";
  if (month >= 5 && month <= 7)
    return "Summer heat — prioritize drought-tolerant choices and irrigation.";
  if (month >= 8 && month <= 10)
    return "Fall is excellent for trees and climate-native planting.";
  return "Winter dormancy — plan structure; plant bare-root trees where appropriate.";
}

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

type SpaceType = LandscapeDesignRequest["spaceType"];

const STYLE_PLANTS: Record<
  StyleGoal,
  { trees: string[]; shrubs: string[]; flowers: string[]; ground_cover: string[] }
> = {
  fruit_garden: {
    trees: ["Meyer lemon", "Fig (Brown Turkey)", "Dwarf peach"],
    shrubs: ["Blueberry (Southern highbush)", "Pomegranate", "Goji berry"],
    flowers: ["Comfrey (companion)", "Marigolds (pest deterrent)"],
    ground_cover: ["Strawberry runners", "Creeping thyme between paths"],
  },
  low_maintenance: {
    trees: ["Olive (dwarf)", "Desert willow"],
    shrubs: ["Rosemary", "Lavender", "Agave (accent)"],
    flowers: ["Gaura", "Yarrow (minimal deadheading)"],
    ground_cover: ["Dymondia", "Decomposed granite + sedum"],
  },
  native_garden: {
    trees: ["Coast live oak (where space allows)", "Western redbud"],
    shrubs: ["California lilac (Ceanothus)", "Manzanita", "Toyon"],
    flowers: ["California poppy", "Penstemon", "Yarrow"],
    ground_cover: ["Creeping sage", "Native sedge mix"],
  },
  tropical: {
    trees: ["Banana (ornamental)", "Bird of paradise (Strelitzia)"],
    shrubs: ["Hibiscus", "Plumeria (container in cold zones)"],
    flowers: ["Bromeliads", "Canna lily"],
    ground_cover: ["Liriope", "Sweet potato vine (seasonal)"],
  },
  mediterranean: {
    trees: ["Olive", "Italian cypress (narrow spaces)"],
    shrubs: ["Lavender", "Rosemary", "Santolina"],
    flowers: ["Sage", "Catmint"],
    ground_cover: ["Creeping thyme", "Gravel mulch beds"],
  },
  japanese_garden: {
    trees: ["Japanese maple", "Weeping cherry"],
    shrubs: ["Azalea", "Nandina", "Boxwood (sheared)"],
    flowers: ["Japanese iris (seasonal)", "Camellia"],
    ground_cover: ["Moss patches", "Fine gravel raked paths"],
  },
  kids_family: {
    trees: ["Shade tree (maple or oak)", "Dwarf apple"],
    shrubs: ["Hydrangea", "Loropetalum (soft texture)"],
    flowers: ["Sunflowers", "Zinnias (easy color)"],
    ground_cover: ["Durable lawn or play-safe mulch zone"],
  },
  pollinator: {
    trees: ["Crabapple", "Eastern redbud"],
    shrubs: ["Butterfly bush (Buddleia)", "Lilac"],
    flowers: ["Salvia", "Echinacea", "Milkweed (Asclepias)"],
    ground_cover: ["Creeping phlox", "Native wildflower mix"],
  },
  privacy: {
    trees: ["Italian cypress", "Clumping bamboo (contained)"],
    shrubs: ["Viburnum", "Privet (formal hedge)", "Photinia"],
    flowers: ["Minimal — focus on evergreen structure"],
    ground_cover: ["Mulched beds under hedge line"],
  },
  outdoor_living: {
    trees: ["Patio shade tree (palo verde or maple)"],
    shrubs: ["Ornamental grass screens", "Lavender border"],
    flowers: ["Container seasonal color near seating"],
    ground_cover: ["Pavers + planted joints", "Low herbs near kitchen zone"],
  },
};

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

  const maintenance =
    req.styleGoal === "low_maintenance" || req.styleGoal === "native_garden"
      ? "low"
      : req.styleGoal === "japanese_garden" || req.styleGoal === "tropical"
        ? "high"
        : "moderate";

  const soilPrep = isSlope
    ? "Terrace steep sections with retaining timbers or boulders; amend planting pockets with compost; install jute erosion netting on bare slopes before planting."
    : isSmall
      ? "Refresh container mix; ensure drainage holes; top-dress beds with 2 in. compost."
      : "Remove weeds, loosen compacted soil 8–12 in., incorporate 3 in. compost, and grade for drainage away from structures.";

  const firstSteps = [
    "Clear weeds and mark utility lines before digging.",
    isSlope
      ? "Address erosion with temporary netting; plant deep-rooted shrubs on contour."
      : "Lay out beds and paths with hose or spray paint.",
    `Source climate-appropriate plants for Zone ${record.usdaZone}.`,
    "Install drip irrigation before mulching.",
    "Mulch all beds 2–3 inches after planting.",
  ];

  const budgetBase = isSmall
    ? { budget: "$150–400", balanced: "$400–900", premium: "$900–2,000" }
    : { budget: "$800–2,500", balanced: "$2,500–8,000", premium: "$8,000–25,000+" };

  return {
    analysis: {
      space_type: req.spaceType,
      estimated_sq_ft: sqOverride ?? defaults.sqFt,
      estimated_dimensions: defaults.dims,
      existing_plants: defaults.plants,
      sunlight: req.sunExposure,
      sunlight_notes:
        req.sunExposure === "full_sun"
          ? "Open exposure — 6+ hours direct sun expected for most of the space."
          : req.sunExposure === "partial_sun"
            ? "Mixed sun/shade — morning sun with afternoon protection from structures."
            : req.sunExposure === "shade"
              ? "Limited direct sun — prioritize shade-tolerant understory plants."
              : "Variable light — zone plants by microclimate (north vs south facing).",
      site_notes:
        req.notes?.trim() ||
        `${STYLE_GOAL_LABELS[req.styleGoal]} layout with ${YARD_SIZE_LABELS[req.yardSize].toLowerCase()}.`,
    },
    climate: {
      zip_code: req.zipCode,
      city: record.city,
      usda_zone: record.usdaZone,
      climate_type: record.climateType,
      season_note: seasonNote(),
    },
    recommendations: {
      trees,
      shrubs: stylePlants.shrubs,
      flowers: stylePlants.flowers,
      ground_cover: isSlope
        ? ["Creeping rosemary (erosion control)", ...stylePlants.ground_cover.slice(0, 2)]
        : stylePlants.ground_cover,
    },
    irrigation: {
      approach: isSmall
        ? "Drip irrigation to containers + hand-watering backup"
        : isSlope
          ? "Drip on contour lines + bubblers at tree wells; avoid overhead spray on slopes"
          : "Smart drip zones by hydrozone + 2–3× weekly deep soak in summer",
      notes:
        record.climateType === "Mediterranean"
          ? "Mediterranean climate — group plants by water need; reduce frequency in winter."
          : "Match irrigation to local heat; mulch all beds 2–3 inches to retain moisture.",
    },
    soil_prep: soilPrep,
    maintenance_level: maintenance,
    maintenance_notes:
      maintenance === "low"
        ? "Seasonal pruning and mulch refresh; minimal deadheading."
        : maintenance === "high"
          ? "Regular shaping, seasonal color rotation, and attentive watering."
          : "Monthly check-ins, seasonal pruning, and spring/fall feeding.",
    estimated_budget: BUDGET_RANGE_LABELS[req.budgetRange],
    first_steps: firstSteps,
    budget_options: [
      {
        tier: "budget",
        label: "Budget Plan",
        estimated_cost: formatCostRange(budgetBase.budget, costFactor),
        summary: "Starter plants, mulch, basic drip, DIY install over a weekend.",
        plant_list: [
          "1 focal tree or large shrub",
          "Seasonal color packs",
          "Ground cover flats",
          "Basic drip kit",
        ],
        highlights: ["Big-box nursery finds", "Mulch-heavy beds", "Hand watering first season"],
      },
      {
        tier: "balanced",
        label: "Balanced Plan",
        estimated_cost: formatCostRange(budgetBase.balanced, costFactor),
        summary: "Quality nursery stock, zoned drip, layered structure — best long-term value.",
        plant_list: [
          "1–2 structural trees",
          "Mixed perennial border",
          "Climate-appropriate ground cover",
          "3-zone drip + timer",
        ],
        highlights: ["Local nursery quality", `${STYLE_GOAL_LABELS[req.styleGoal]} palette`, "Smart timer"],
      },
      {
        tier: "premium",
        label: "Premium Plan",
        estimated_cost: formatCostRange(budgetBase.premium, costFactor),
        summary: "Designer layout, mature specimens, pro irrigation, hardscape coordination.",
        plant_list: [
          "Mature specimen tree(s)",
          "Designer shrub palette",
          "Seasonal color program",
          "Premium soil prep + pro irrigation",
        ],
        highlights: ["Instant impact", "Designer consult", "Premium soil amendment"],
      },
    ],
    design_summary: `A ${STYLE_GOAL_LABELS[req.styleGoal].toLowerCase()} concept for your ${SPACE_TYPE_LABELS[req.spaceType].toLowerCase()} in ${record.city} (Zone ${record.usdaZone}). The plan balances ${YARD_SIZE_LABELS[req.yardSize].toLowerCase()} with ${req.sunExposure.replace("_", " ")} exposure and targets ${BUDGET_RANGE_LABELS[req.budgetRange].toLowerCase()}. ${seasonNote()}`,
    source: "mock",
  };
}

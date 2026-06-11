import type {
  PlantCareGuide,
  PlantSpecies,
  RiskLevel,
} from "../types";
import { PLANT_SPECIES } from "./plants";
import { SOIL_TYPES } from "./soils";
import { FERTILIZERS } from "./fertilizers";
import { PESTS } from "./pests";
import { DISEASES } from "./diseases";

export interface SoilMatch {
  plant_species_id: string;
  soil_type_id: string;
  suitability: string;
  notes?: string;
}

export interface FertilizerMatch {
  plant_species_id: string;
  fertilizer_id: string;
  suitability: string;
  notes?: string;
}

export interface PestRisk {
  plant_species_id: string;
  pest_id: string;
  risk_level: RiskLevel;
  notes?: string;
}

export interface DiseaseRisk {
  plant_species_id: string;
  disease_id: string;
  risk_level: RiskLevel;
  notes?: string;
}

function soilForType(type: PlantSpecies["type"]): string[] {
  switch (type) {
    case "succulent":
      return ["soil-cactus", "soil-succulent", "soil-sandy"];
    case "indoor":
      return ["soil-potting", "soil-peat", "soil-palm"];
    case "vegetable":
      return ["soil-vegetable", "soil-raised", "soil-loamy"];
    case "tree":
      return ["soil-loamy", "soil-compost", "soil-native"];
    case "herb":
      return ["soil-loamy", "soil-sandy", "soil-potting"];
    case "flower":
      return ["soil-loamy", "soil-rose", "soil-compost"];
    default:
      return ["soil-loamy", "soil-potting", "soil-compost"];
  }
}

function fertForType(type: PlantSpecies["type"], name: string): string[] {
  const lower = name.toLowerCase();
  if (lower.includes("citrus") || lower.includes("lemon") || lower.includes("lime") || lower.includes("orange"))
    return ["fert-citrus", "fert-compost"];
  if (lower.includes("rose")) return ["fert-rose", "fert-compost"];
  if (lower.includes("tomato") || lower.includes("pepper"))
    return ["fert-tomato", "fert-calcium"];
  if (type === "succulent") return ["fert-succulent"];
  if (type === "indoor") return ["fert-fish", "fert-worm"];
  if (lower.includes("palm")) return ["fert-palm"];
  if (lower.includes("orchid")) return ["fert-orchid"];
  return ["fert-all-purpose", "fert-compost"];
}

function pestsForType(type: PlantSpecies["type"]): PestRisk[] {
  const common: PestRisk[] = [
    { plant_species_id: "", pest_id: "pest-aphids", risk_level: "medium" },
    { plant_species_id: "", pest_id: "pest-spider-mites", risk_level: "medium" },
  ];
  if (type === "indoor" || type === "succulent") {
    common.push(
      { plant_species_id: "", pest_id: "pest-mealybugs", risk_level: "high" },
      { plant_species_id: "", pest_id: "pest-fungus-gnats", risk_level: "medium" },
      { plant_species_id: "", pest_id: "pest-scale", risk_level: "medium" }
    );
  }
  if (type === "vegetable") {
    common.push(
      { plant_species_id: "", pest_id: "pest-caterpillars", risk_level: "high" },
      { plant_species_id: "", pest_id: "pest-slugs", risk_level: "medium" },
      { plant_species_id: "", pest_id: "pest-whiteflies", risk_level: "medium" }
    );
  }
  if (type === "flower" || type === "shrub") {
    common.push(
      { plant_species_id: "", pest_id: "pest-thrips", risk_level: "medium" },
      { plant_species_id: "", pest_id: "pest-japanese-beetle", risk_level: "low" }
    );
  }
  return common;
}

function diseasesForType(type: PlantSpecies["type"], name: string): DiseaseRisk[] {
  const lower = name.toLowerCase();
  const risks: DiseaseRisk[] = [
    { plant_species_id: "", disease_id: "dis-root-rot", risk_level: "medium" },
  ];
  if (type === "vegetable") {
    risks.push(
      { plant_species_id: "", disease_id: "dis-blight", risk_level: "high" },
      { plant_species_id: "", disease_id: "dis-powdery-mildew", risk_level: "medium" }
    );
  }
  if (type === "flower") {
    risks.push(
      { plant_species_id: "", disease_id: "dis-powdery-mildew", risk_level: "medium" },
      { plant_species_id: "", disease_id: "dis-botrytis", risk_level: "medium" }
    );
  }
  if (lower.includes("rose")) {
    risks.push(
      { plant_species_id: "", disease_id: "dis-black-spot", risk_level: "high" },
      { plant_species_id: "", disease_id: "dis-rust", risk_level: "medium" }
    );
  }
  if (lower.includes("citrus") || lower.includes("lemon") || lower.includes("lime")) {
    risks.push({ plant_species_id: "", disease_id: "dis-citrus-greening", risk_level: "low" });
  }
  if (lower.includes("tomato") || lower.includes("pepper")) {
    risks.push({ plant_species_id: "", disease_id: "dis-blossom-end-rot", risk_level: "medium" });
  }
  if (type === "indoor") {
    risks.push({ plant_species_id: "", disease_id: "dis-root-rot", risk_level: "high" });
  }
  return risks;
}

export function buildCareGuide(species: PlantSpecies): PlantCareGuide {
  return {
    id: `guide-${species.id}`,
    plant_species_id: species.id,
    watering_guide: species.watering,
    sunlight_guide: species.sunlight,
    soil_guide: species.soil_preference,
    fertilizer_guide: `Feed during active growth with a formula suited to ${species.type} plants. Reduce or stop in dormancy.`,
    pruning_guide:
      species.type === "tree" || species.type === "shrub"
        ? "Prune dead or crossing branches in late winter. Shape lightly after bloom for flowering types."
        : "Remove dead or yellowing leaves regularly. Pinch herbs to encourage bushiness.",
    repotting_guide:
      species.type === "indoor" || species.type === "succulent"
        ? "Repot every 1–2 years in spring when roots circle the pot. Use fresh appropriate mix."
        : "Container plants benefit from repotting every 2–3 years with refreshed soil.",
    seasonal_care: `Zones ${species.hardiness_zone_min}–${species.hardiness_zone_max}: protect from extremes outside range. Adjust watering seasonally: less in winter for most plants.`,
    common_problems: "Overwatering, insufficient light, and pest outbreaks are the most common issues. Match care to the plant's native habits.",
    beginner_tips: `Start with consistent ${species.watering.toLowerCase()}. Place where it gets ${species.sunlight.toLowerCase()}. Check soil before watering.`,
  };
}

export const PLANT_CARE_GUIDES: PlantCareGuide[] = PLANT_SPECIES.map(buildCareGuide);

export const PLANT_SOIL_MATCHES: SoilMatch[] = PLANT_SPECIES.flatMap((s) =>
  soilForType(s.type).map((soilId) => ({
    plant_species_id: s.id,
    soil_type_id: soilId,
    suitability: "recommended",
  }))
);

export const PLANT_FERTILIZER_MATCHES: FertilizerMatch[] = PLANT_SPECIES.flatMap((s) =>
  fertForType(s.type, s.common_name).map((fertId) => ({
    plant_species_id: s.id,
    fertilizer_id: fertId,
    suitability: "recommended",
  }))
);

export const PLANT_PEST_RISKS: PestRisk[] = PLANT_SPECIES.flatMap((s) =>
  pestsForType(s.type).map((r) => ({
    ...r,
    plant_species_id: s.id,
  }))
);

export const PLANT_DISEASE_RISKS: DiseaseRisk[] = PLANT_SPECIES.flatMap((s) =>
  diseasesForType(s.type, s.common_name).map((r) => ({
    ...r,
    plant_species_id: s.id,
  }))
);

export {
  PLANT_SPECIES,
  SOIL_TYPES,
  FERTILIZERS,
  PESTS,
  DISEASES,
};

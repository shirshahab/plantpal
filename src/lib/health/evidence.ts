/**
 * Evidence checklist — shows the user exactly which observations drove the
 * diagnosis, organized by what PlantPal looked at. Builds trust by making
 * the reasoning inspectable instead of a black box.
 */
import type {
  ConfidenceTier,
  EvidenceCategory,
  EvidenceItem,
  ProDiagnosisInput,
  SymptomId,
} from "@/lib/types/health";

interface CategoryDef {
  category: EvidenceCategory;
  label: string;
  symptoms: SymptomId[];
}

const SYMPTOM_CATEGORIES: CategoryDef[] = [
  {
    category: "leaf_pattern",
    label: "Leaf pattern",
    symptoms: ["curling_leaves", "wilting", "leaf_drop", "slow_growth"],
  },
  {
    category: "color",
    label: "Color changes",
    symptoms: ["yellow_leaves", "nutrient_burn"],
  },
  {
    category: "spots",
    label: "Spots & speckling",
    symptoms: ["brown_spots", "speckling"],
  },
  {
    category: "powder",
    label: "Powder & mold",
    symptoms: ["white_powder", "mold_fungus"],
  },
  {
    category: "pests",
    label: "Pests & residue",
    symptoms: ["pests_visible", "webbing", "sticky_residue"],
  },
];

const SYMPTOM_DETAILS: Partial<Record<SymptomId, string>> = {
  curling_leaves: "curling leaves",
  wilting: "wilting",
  leaf_drop: "leaf drop",
  slow_growth: "slow growth",
  yellow_leaves: "yellowing leaves",
  nutrient_burn: "burnt or crispy leaf tips",
  brown_spots: "brown spots",
  speckling: "tiny speckles on leaves",
  white_powder: "white powder on leaves",
  mold_fungus: "mold or fungus",
  pests_visible: "visible pests",
  webbing: "webbing",
  sticky_residue: "sticky residue",
  soggy_soil: "soggy soil or odor",
};

function joinDetails(ids: SymptomId[]): string {
  const parts = ids.map((id) => SYMPTOM_DETAILS[id]).filter(Boolean) as string[];
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** Build the "why PlantPal thinks this" checklist from the intake. */
export function buildEvidence(input: ProDiagnosisInput): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  const selected = new Set(input.symptoms);

  for (const def of SYMPTOM_CATEGORIES) {
    const matched = def.symptoms.filter((s) => selected.has(s));
    const observed = matched.length > 0;
    items.push({
      category: def.category,
      label: def.label,
      detail: observed
        ? `You reported ${joinDetails(matched)}.`
        : "No issues reported here.",
      observed,
    });
  }

  // Environment evidence — only the factors actually provided.
  const env = input.environment;
  const envFactors = [
    env.humidity && `humidity: ${env.humidity}`,
    env.airflow && `airflow: ${env.airflow}`,
    env.temperature && `temperature: ${env.temperature}`,
    env.lightIntensity && `light: ${env.lightIntensity}`,
  ].filter(Boolean) as string[];
  items.push({
    category: "environment",
    label: "Environment",
    detail:
      envFactors.length > 0
        ? `Conditions considered — ${envFactors.join("; ")}.`
        : "No environment details provided.",
    observed: envFactors.length > 0,
  });

  // Watering & feeding history.
  const waterFactors = [
    env.wateringFrequency && `watering ${env.wateringFrequency}`,
    env.fertilizerUsed && `fertilizer: ${env.fertilizerUsed}`,
    selected.has("soggy_soil") && "soggy soil reported",
  ].filter(Boolean) as string[];
  items.push({
    category: "watering_history",
    label: "Watering history",
    detail:
      waterFactors.length > 0
        ? `History considered — ${waterFactors.join("; ")}.`
        : "No watering history provided.",
    observed: waterFactors.length > 0,
  });

  return items;
}

/**
 * Map a raw confidence score + photo coverage to a user-facing trust tier.
 * Low confidence with little photo evidence becomes "needs better photos" —
 * the honest answer is to ask for more input, not to guess harder.
 */
export function deriveConfidenceTier(
  confidence: number,
  photoCount: number
): ConfidenceTier {
  if (confidence >= 75) return "high";
  if (confidence >= 50) return "medium";
  return photoCount >= 2 ? "low" : "needs_photos";
}

export const CONFIDENCE_TIER_COPY: Record<
  ConfidenceTier,
  { label: string; description: string }
> = {
  high: {
    label: "High confidence",
    description: "Symptoms, environment, and photos point clearly to this issue.",
  },
  medium: {
    label: "Medium confidence",
    description:
      "The pattern fits, but a couple of look-alike issues remain possible. Follow the plan and rescan.",
  },
  low: {
    label: "Low confidence",
    description:
      "Signals are mixed. Treat this as a starting hypothesis and monitor closely before major interventions.",
  },
  needs_photos: {
    label: "Needs better photos",
    description:
      "There isn't enough visual evidence for a confident call. Add clear photos of the leaf top, underside, and the affected area, then rescan.",
  },
};

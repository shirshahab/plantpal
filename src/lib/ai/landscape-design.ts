import type { LandscapeDesignRequest, LandscapeDesignResponse } from "@/lib/landscape/types";
import {
  BUDGET_RANGE_LABELS,
  SPACE_TYPE_LABELS,
  STYLE_GOAL_LABELS,
  SUN_EXPOSURE_LABELS,
  YARD_SIZE_LABELS,
  maintenancePrefToLevel,
} from "@/lib/landscape/types";
import { getGardenStyleOption } from "@/lib/landscape/garden-styles";
import { enrichPlantListWithSuitability } from "@/lib/landscape/enrich-plants";
import { mockLandscapeDesign } from "@/lib/landscape/mock-design";
import { lookupZipRecord } from "@/lib/location/usda-zones";
import { generateLandscapeConceptImage } from "./landscape-render";
import { visionJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT } from "./prompts";

const SCHEMA = `{
  "analysis": {
    "estimated_sq_ft": "string",
    "estimated_dimensions": "string",
    "existing_plants": ["string"],
    "sunlight": "full_sun" | "partial_sun" | "shade" | "mixed",
    "sunlight_notes": "string",
    "site_notes": "string"
  },
  "after_concept": {
    "headline": "string",
    "description": "string — vivid 2-3 sentence after vision",
    "key_changes": ["string — 3-5 visible changes"],
    "accent_color": "string"
  },
  "layout_suggestions": ["string — 3-5 layout ideas"],
  "recommendations": {
    "trees": ["string"],
    "shrubs": ["string"],
    "flowers": ["string"],
    "ground_cover": ["string"]
  },
  "plant_list": [
    {
      "name": "string",
      "category": "tree" | "shrub" | "flower" | "ground_cover" | "edible" | "accent",
      "quantity": "string",
      "est_price": "string"
    }
  ],
  "irrigation": { "approach": "string", "notes": "string" },
  "soil_prep": "string",
  "maintenance_level": "low" | "moderate" | "high",
  "maintenance_notes": "string",
  "maintenance_score": "number 0-100 — lower = more upkeep",
  "estimated_budget": "string",
  "first_steps": ["string"],
  "phased_plan": [
    {
      "phase": 1 | 2 | 3,
      "title": "string",
      "timeframe": "string",
      "tasks": ["string"],
      "estimated_cost": "string"
    }
  ],
  "budget_options": [
    {
      "tier": "budget" | "balanced" | "premium",
      "label": "string",
      "estimated_cost": "string",
      "summary": "string",
      "plant_list": ["string"],
      "highlights": ["string"]
    }
  ],
  "design_summary": "string"
}`;

function maintenanceScoreFromLevel(level: LandscapeDesignResponse["maintenance_level"]): number {
  if (level === "low") return 85;
  if (level === "high") return 40;
  return 62;
}

export async function generateLandscapeDesign(
  req: LandscapeDesignRequest
): Promise<LandscapeDesignResponse> {
  const record = lookupZipRecord(req.zipCode);
  const styleOpt = getGardenStyleOption(req.styleGoal);

  if (!isOpenAIConfigured()) {
    return mockLandscapeDesign(req);
  }

  const images = [
    req.imageDataUrl,
    ...(req.additionalPhotos?.map((p) => p.dataUrl) ?? []),
  ].filter(Boolean);

  const prompt = [
    `Garden style: ${STYLE_GOAL_LABELS[req.styleGoal]} — ${styleOpt.description}`,
    `Space: ${SPACE_TYPE_LABELS[req.spaceType]}.`,
    `ZIP: ${req.zipCode} (${record.city}, USDA Zone ${record.usdaZone}).`,
    `Sun: ${SUN_EXPOSURE_LABELS[req.sunExposure]}.`,
    `Size: ${YARD_SIZE_LABELS[req.yardSize]}.`,
    `Budget: ${BUDGET_RANGE_LABELS[req.budgetRange]}.`,
    req.maintenancePreference
      ? `Maintenance preference: ${req.maintenancePreference}.`
      : "",
    req.notes ? `Notes: ${req.notes}` : "",
    "Analyze yard photo(s). Return phased_plan (3 phases), layout_suggestions, plant_list with prices, maintenance_score.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const raw = await visionJSON<
      Omit<
        LandscapeDesignResponse,
        "source" | "climate" | "analysis" | "after_image_url"
      > & {
        analysis: Omit<LandscapeDesignResponse["analysis"], "space_type">;
      }
    >(
      `${GARDENER_SYSTEM_PROMPT}\n\nExpert landscape designer. Create a complete design brief. Return JSON:\n${SCHEMA}`,
      prompt,
      images.length > 1 ? images : images[0]!,
      { detail: "low" }
    );

    const mock = mockLandscapeDesign(req);
    const maintenanceLevel =
      raw.maintenance_level ??
      (req.maintenancePreference
        ? maintenancePrefToLevel(req.maintenancePreference)
        : styleOpt.defaultMaintenance);

    let afterImageUrl: string | null = null;
    if (req.generateConceptImage !== false) {
      afterImageUrl = await generateLandscapeConceptImage({
        styleLabel: STYLE_GOAL_LABELS[req.styleGoal],
        spaceLabel: SPACE_TYPE_LABELS[req.spaceType],
        description: raw.after_concept?.description ?? mock.after_concept.description,
        zipCode: req.zipCode,
        usdaZone: record.usdaZone,
      });
    }

    const plantList = enrichPlantListWithSuitability(
      raw.plant_list?.length > 0 ? raw.plant_list : mock.plant_list,
      req.zipCode,
      req.sunExposure
    );

    return {
      analysis: {
        ...raw.analysis,
        space_type: req.spaceType,
        sunlight: raw.analysis.sunlight ?? req.sunExposure,
      },
      climate: mock.climate,
      recommendations: raw.recommendations ?? mock.recommendations,
      irrigation: raw.irrigation ?? mock.irrigation,
      soil_prep: raw.soil_prep ?? mock.soil_prep,
      maintenance_level: maintenanceLevel,
      maintenance_notes: raw.maintenance_notes ?? mock.maintenance_notes,
      maintenance_score:
        raw.maintenance_score ?? maintenanceScoreFromLevel(maintenanceLevel),
      estimated_budget: raw.estimated_budget ?? styleOpt.costRange,
      first_steps: raw.first_steps ?? mock.first_steps,
      budget_options: raw.budget_options ?? mock.budget_options,
      design_summary: raw.design_summary ?? mock.design_summary,
      layout_suggestions: raw.layout_suggestions ?? mock.layout_suggestions,
      phased_plan: raw.phased_plan?.length ? raw.phased_plan : mock.phased_plan,
      after_concept: raw.after_concept ?? mock.after_concept,
      after_image_url: afterImageUrl,
      plant_list: plantList,
      source: "ai",
    };
  } catch {
    return mockLandscapeDesign(req);
  }
}

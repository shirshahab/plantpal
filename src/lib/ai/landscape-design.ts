import type { LandscapeDesignRequest, LandscapeDesignResponse } from "@/lib/landscape/types";
import {
  BUDGET_RANGE_LABELS,
  SPACE_TYPE_LABELS,
  STYLE_GOAL_LABELS,
  SUN_EXPOSURE_LABELS,
  YARD_SIZE_LABELS,
} from "@/lib/landscape/types";
import { mockLandscapeDesign } from "@/lib/landscape/mock-design";
import { lookupZipRecord } from "@/lib/location/usda-zones";
import { visionJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT } from "./prompts";

const SCHEMA = `{
  "analysis": {
    "estimated_sq_ft": "string range e.g. 400-800 sq ft",
    "estimated_dimensions": "string",
    "existing_plants": ["string"],
    "sunlight": "full_sun" | "partial_sun" | "shade" | "mixed",
    "sunlight_notes": "string",
    "site_notes": "string"
  },
  "recommendations": {
    "trees": ["string — 2-4 species suited to space and style"],
    "shrubs": ["string"],
    "flowers": ["string"],
    "ground_cover": ["string"]
  },
  "irrigation": {
    "approach": "string",
    "notes": "string"
  },
  "soil_prep": "string — practical prep steps for this site",
  "maintenance_level": "low" | "moderate" | "high",
  "maintenance_notes": "string",
  "estimated_budget": "string — overall ballpark aligned to user budget range",
  "first_steps": ["string — 3-5 ordered action items"],
  "budget_options": [
    {
      "tier": "budget" | "balanced" | "premium",
      "label": "Budget Plan" | "Balanced Plan" | "Premium Plan",
      "estimated_cost": "string range",
      "summary": "string",
      "plant_list": ["string"],
      "highlights": ["string"]
    }
  ],
  "design_summary": "string — overall design concept, 2-4 sentences"
}`;

export async function generateLandscapeDesign(
  req: LandscapeDesignRequest
): Promise<LandscapeDesignResponse> {
  const record = lookupZipRecord(req.zipCode);

  if (!isOpenAIConfigured()) {
    return mockLandscapeDesign(req);
  }

  const spaceLabel = SPACE_TYPE_LABELS[req.spaceType];
  const styleLabel = STYLE_GOAL_LABELS[req.styleGoal];
  const sunLabel = SUN_EXPOSURE_LABELS[req.sunExposure];
  const sizeLabel = YARD_SIZE_LABELS[req.yardSize];
  const budgetLabel = BUDGET_RANGE_LABELS[req.budgetRange];

  const prompt = [
    `Space type: ${spaceLabel}.`,
    `Style goal: ${styleLabel}.`,
    `ZIP: ${req.zipCode} (${record.city}, USDA Zone ${record.usdaZone}, ${record.climateType} climate).`,
    `User-reported sun: ${sunLabel}.`,
    `Yard size: ${sizeLabel}.`,
    `Budget range: ${budgetLabel}.`,
    req.notes ? `Additional notes: ${req.notes}` : "",
    "Analyze the photo: estimate planting area, list visible existing plants, and recommend climate-appropriate trees, shrubs, flowers, ground cover, irrigation, soil prep, maintenance level, first steps, and three plan tiers (Budget, Balanced, Premium).",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const raw = await visionJSON<
      Omit<LandscapeDesignResponse, "source" | "climate" | "analysis"> & {
        analysis: Omit<LandscapeDesignResponse["analysis"], "space_type">;
      }
    >(
      `${GARDENER_SYSTEM_PROMPT}\n\nYou are an expert landscape designer. Analyze outdoor space photos and return practical, climate-appropriate planting plans. Return JSON:\n${SCHEMA}`,
      prompt,
      req.imageDataUrl
    );

    return {
      analysis: {
        ...raw.analysis,
        space_type: req.spaceType,
        sunlight: raw.analysis.sunlight ?? req.sunExposure,
      },
      climate: {
        zip_code: req.zipCode,
        city: record.city,
        usda_zone: record.usdaZone,
        climate_type: record.climateType,
        season_note: mockLandscapeDesign(req).climate.season_note,
      },
      recommendations: raw.recommendations,
      irrigation: raw.irrigation,
      soil_prep: raw.soil_prep,
      maintenance_level: raw.maintenance_level,
      maintenance_notes: raw.maintenance_notes,
      estimated_budget: raw.estimated_budget,
      first_steps: raw.first_steps,
      budget_options: raw.budget_options,
      design_summary: raw.design_summary,
      source: "ai",
    };
  } catch {
    return mockLandscapeDesign(req);
  }
}

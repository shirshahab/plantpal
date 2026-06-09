import type { LandscapeDesignResponse } from "./types";

/** Ensure legacy saved designs have Phase 38 fields. */
export function normalizeDesign(design: Partial<LandscapeDesignResponse>): LandscapeDesignResponse {
  const maintenance = design.maintenance_level ?? "moderate";
  return {
    analysis: design.analysis!,
    climate: design.climate!,
    recommendations: design.recommendations!,
    irrigation: design.irrigation!,
    soil_prep: design.soil_prep ?? "",
    maintenance_level: maintenance,
    maintenance_notes: design.maintenance_notes ?? "",
    maintenance_score:
      design.maintenance_score ??
      (maintenance === "low" ? 85 : maintenance === "high" ? 42 : 65),
    estimated_budget: design.estimated_budget ?? "",
    first_steps: design.first_steps ?? [],
    budget_options: design.budget_options ?? [],
    design_summary: design.design_summary ?? "",
    layout_suggestions: design.layout_suggestions ?? [],
    phased_plan: design.phased_plan ?? [],
    after_concept: design.after_concept!,
    after_image_url: design.after_image_url ?? null,
    plant_list: design.plant_list ?? [],
    source: design.source ?? "mock",
  };
}

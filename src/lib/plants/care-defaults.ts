/** Default care values by species — platform-agnostic business logic. */
export function defaultCareForSpecies(species: string) {
  const lower = species.toLowerCase();
  if (lower.includes("citrus") || lower.includes("lemon")) {
    return {
      waterFrequencyDays: 3,
      fertilizeFrequencyWeeks: 6,
      pruneSchedule: "Late winter",
      wateringInstructions: "Water deeply when top inch of soil is dry.",
      fertilizingInstructions: "Citrus-specific fertilizer every 6 weeks.",
      pruningInstructions: "Prune in late winter to shape.",
    };
  }
  if (lower.includes("ficus") || lower.includes("fig")) {
    return {
      waterFrequencyDays: 7,
      fertilizeFrequencyWeeks: 8,
      pruneSchedule: "As needed",
      wateringInstructions: "Water when top 2 inches of soil are dry.",
      fertilizingInstructions:
        "Diluted liquid fertilizer monthly in spring/summer.",
      pruningInstructions: "Trim to control height as needed.",
    };
  }
  return {
    waterFrequencyDays: 5,
    fertilizeFrequencyWeeks: 8,
    pruneSchedule: "Early spring",
    wateringInstructions: "Keep soil evenly moist, not soggy.",
    fertilizingInstructions:
      "Balanced fertilizer every 8 weeks in growing season.",
    pruningInstructions: "Remove dead or damaged growth in early spring.",
  };
}

export const DEFAULT_PLANT_IMAGE =
  "https://images.unsplash.com/photo-1466692476860-aef1dfb1e735?w=800&q=80";

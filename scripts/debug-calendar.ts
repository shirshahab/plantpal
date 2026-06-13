/**
 * Calendar care roadmap debug script.
 * Usage: npm run debug:calendar
 */
import { buildCareRoadmap } from "../src/lib/calendar/care-roadmap";
import type { Plant } from "../src/lib/types";

const sampleAvocado: Plant = {
  id: "debug-avocado",
  name: "Guacamole Jr.",
  species: "Persea americana",
  image: "/artwork/plantpal-generic.webp",
  locationType: "outdoor",
  plantingType: "ground",
  zipCode: "91107",
  hardinessZone: "10a",
  sunExposure: "full_sun",
  waterFrequencyDays: 4,
  fertilizeFrequencyWeeks: 6,
  pruneSchedule: "Early spring",
  healthStatus: "healthy",
  healthNotes: "",
  wateringInstructions: "Deep water when top inch dries.",
  fertilizingInstructions: "Citrus/avocado fertilizer in growing season.",
  pruningInstructions: "Light shaping in early spring.",
  lastWateredAt: new Date().toISOString(),
  lastFertilizedAt: null,
  createdAt: new Date().toISOString(),
  photoStatus: "placeholder",
  placeholderImageType: "generic",
  sizeType: "medium",
  nurseryContainerSize: null,
  heightFeet: null,
  heightInches: null,
  potDiameterInches: null,
  trunkDiameterInches: null,
  estimatedAgeMonths: null,
  plantedDate: null,
  purchaseDate: null,
  purchasePrice: null,
  purchaseStore: null,
};

function main() {
  const events = buildCareRoadmap({
    plants: [sampleAvocado],
    city: "Pasadena",
    zone: "10a",
    startDate: new Date(),
    months: 12,
  });

  const byType = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  console.log("=== PlantPal calendar debug ===\n");
  console.log(`Roadmap events (1 plant, 12 months): ${events.length}`);
  console.log("By type:", byType);

  const hasWater = (byType.water ?? 0) > 0;
  const hasFert = (byType.fertilizer ?? 0) > 0;
  const hasPrune = (byType.prune ?? 0) > 0;
  const hasWeekly = (byType.weekly_check ?? 0) > 0;

  console.log("\nChecks:");
  console.log(hasWater ? "✓ Water events projected" : "✗ Missing water events");
  console.log(hasFert ? "✓ Fertilizer events projected" : "✗ Missing fertilizer events");
  console.log(hasPrune ? "✓ Prune windows projected" : "✗ Missing prune events");
  console.log(hasWeekly ? "✓ Weekly checks projected" : "✗ Missing weekly checks");
  console.log(events.length >= 20 ? "✓ Sufficient roadmap density" : "✗ Roadmap too sparse");

  if (!hasWater || !hasFert || events.length < 20) {
    process.exit(1);
  }
  console.log("\nCalendar debug OK.");
}

main();

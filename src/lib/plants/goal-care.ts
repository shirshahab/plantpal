import type { Plant, SpeciesCareInput } from "@/lib/types";
import type {
  GoalBasedCarePlan,
  PlantGoal,
  PlantMilestone,
  PlantMission,
} from "@/lib/types/care-goals";
import { parseGallonSize } from "./plant-size";
import { defaultCareForSpecies } from "./care-defaults";
import { dedupeTipStrings } from "@/lib/care/dedupe-care-tips";

/** Infer plant profile from species name for milestone/mission templates. */
export function inferPlantProfile(species: string, name: string) {
  const text = `${species} ${name}`.toLowerCase();
  if (text.match(/citrus|lemon|lime|orange|avocado|apple|peach|mango|fig fruit/))
    return "fruit";
  if (text.match(/rose|bougainvillea|hibiscus|azalea|hydrangea|lavender|bloom/))
    return "flowering";
  if (text.match(/maple|oak|pine|cedar|privacy|hedge|screen/))
    return "landscape";
  if (text.match(/bonsai|juniper|ficus retusa|maple bonsai/))
    return "bonsai";
  if (text.match(/ficus|pothos|monstera|snake plant|philodendrum|indoor/))
    return "indoor";
  return "general";
}

function hasGoal(goals: PlantGoal[], ...ids: string[]) {
  return goals.some((g) => ids.includes(g.id));
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

function seasonLabel(season: string): string {
  return season.charAt(0).toUpperCase() + season.slice(1);
}

/**
 * Generate a personalized care plan from species, ZIP, age, health, and goals.
 * Mock logic today — structured for AI replacement later.
 */
export function generateGoalBasedCarePlan(
  plant: Plant,
  goals: PlantGoal[],
  zipCode: string,
  healthStatus: Plant["healthStatus"],
  speciesBaseCare?: SpeciesCareInput | null
): GoalBasedCarePlan {
  const base = speciesBaseCare ?? defaultCareForSpecies(plant.species);
  let waterDays = base.waterFrequencyDays;
  let fertWeeks = base.fertilizeFrequencyWeeks;
  let pruneSchedule = base.pruneSchedule;

  const wateringAdjustment: string[] = [];
  const fertilizerAdjustment: string[] = [];
  const pruningAdjustment: string[] = [];
  const soilAdjustment: string[] = [];
  const seasonalTasks: string[] = [];
  const warnings: string[] = [];
  const goalSpecificTips: string[] = [];

  const profile = inferPlantProfile(plant.species, plant.name);
  const season = getCurrentSeason();
  const ageDays = Math.floor(
    (Date.now() - new Date(plant.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isNewPlant =
    ageDays < 60 ||
    (plant.plantedDate != null &&
      Math.floor(
        (Date.now() - new Date(plant.plantedDate).getTime()) / (1000 * 60 * 60 * 24)
      ) < 90);

  // Size-aware care adjustments
  if (plant.plantingType === "pot") {
    wateringAdjustment.push(
      "Container plants dry faster than in-ground. Check soil moisture more often."
    );
    if (plant.potDiameterInches && plant.potDiameterInches <= 8) {
      waterDays = Math.max(waterDays - 1, 2);
      goalSpecificTips.push("Small pot: may need water every few days in heat.");
    }
  }

  const gallons = parseGallonSize(plant.nurseryContainerSize);
  if (gallons != null) {
    if (gallons <= 3) {
      waterDays = Math.max(waterDays - 1, 2);
      wateringAdjustment.push(
        `${plant.nurseryContainerSize} nursery stock: smaller root ball needs more frequent checks.`
      );
    } else if (gallons >= 15) {
      waterDays = Math.min(waterDays + 2, 14);
      wateringAdjustment.push(
        `${plant.nurseryContainerSize} tree: deep, less frequent watering once established.`
      );
    }
  }

  if (plant.sizeType === "height" && (plant.heightFeet ?? 0) >= 4) {
    wateringAdjustment.push("Taller specimen: deep soak to reach the full root zone.");
  }

  if (profile === "bonsai" && plant.potDiameterInches) {
    waterDays = Math.max(waterDays - 2, 1);
    goalSpecificTips.push(
      `Bonsai in ${plant.potDiameterInches}" pot: monitor daily, shallow soil dries quickly.`
    );
  }

  if (isNewPlant && plant.plantedDate) {
    waterDays = Math.max(waterDays - 1, 2);
    wateringAdjustment.push(
      "Newly planted. Establishment watering: deep soak 2 to 3 times per week for the first season."
    );
  }
  const climateNote =
    zipCode.startsWith("9") || zipCode.startsWith("85")
      ? "warmer/dryer climate"
      : zipCode.startsWith("0") || zipCode.startsWith("1")
        ? "cooler season shifts"
        : "your local climate";

  // Health recovery overrides
  if (healthStatus === "critical" || hasGoal(goals, "health-recovery")) {
    waterDays = Math.min(waterDays + 1, 10);
    fertWeeks = Math.max(fertWeeks + 2, 10);
    wateringAdjustment.push(
      "Stabilize watering: keep soil evenly moist while your plant recovers. No swings from bone dry to soaked."
    );
    fertilizerAdjustment.push(
      "Cut fertilizer back while your plant is stressed. Feeding a sick plant makes it worse."
    );
    warnings.push("Hold off on heavy pruning until health improves.");
    warnings.push("Shield from harsh afternoon sun while recovering.");
    goalSpecificTips.push("Inspect leaves and stems for pests or rot.");
    goalSpecificTips.push("Watch for new growth. It's the first sign recovery is working.");
  }

  if (hasGoal(goals, "pest-recovery")) {
    fertWeeks = Math.max(fertWeeks + 1, 8);
    seasonalTasks.push(
      `${seasonLabel(season)}: treat weekly with insecticidal soap or neem until pests are gone.`
    );
    warnings.push("Isolate this plant from its neighbors until the pests are gone.");
    goalSpecificTips.push("Check leaf undersides and stem joints every few days. Pests hide there.");
  }

  if (hasGoal(goals, "low-maintenance", "drought-tolerance")) {
    waterDays = Math.min(waterDays + 2, 14);
    fertWeeks = Math.max(fertWeeks + 2, 12);
    wateringAdjustment.push(
      "Because your goal is low maintenance, stretch watering slightly and use mulch to hold moisture."
    );
    soilAdjustment.push("Add 2–3 inches of mulch to reduce watering frequency.");
    goalSpecificTips.push("Group plants with similar needs to simplify your routine.");
  }

  if (hasGoal(goals, "faster-growth", "fuller-growth", "stronger-structure")) {
    waterDays = Math.max(waterDays - 1, 2);
    fertWeeks = Math.max(fertWeeks - 2, 4);
    fertilizerAdjustment.push(
      "Feed lightly but regularly during active growth to support faster development."
    );
    pruningAdjustment.push(
      "Tip-prune leggy stems to trigger branching and fresh growth."
    );
    goalSpecificTips.push("Check for new growth at branch tips this week.");
    goalSpecificTips.push("Maximize light: more light means faster growth, full stop.");
    if (plant.plantingType === "pot") {
      goalSpecificTips.push(
        "Roots circling the pot? Root-bound plants stall. Size up the pot to keep growth moving."
      );
    }
  }

  if (hasGoal(goals, "more-fruit", "bigger-fruit", "earlier-fruiting", "bigger-harvest")) {
    fertWeeks = Math.max(fertWeeks - 1, 4);
    fertilizerAdjustment.push(
      "Your goal is more fruit, so feed with a potassium-rich blend before bloom."
    );
    pruningAdjustment.push(
      "Avoid heavy pruning during bloom and fruit set. Trim lightly after harvest, and prune to keep productive fruiting wood."
    );
    seasonalTasks.push(
      `${seasonLabel(season)}: watch for flower buds and feed before fruit set.`
    );
    goalSpecificTips.push("Track flowering stages. First buds mean you're on track.");
    goalSpecificTips.push(
      "Help pollination along: plant pollinator flowers nearby, or hand-pollinate indoor bloomers with a soft brush."
    );
    warnings.push("Keep watering consistent while fruit forms. Swings cause fruit drop and split skins.");
    if (hasGoal(goals, "bigger-harvest", "bigger-fruit")) {
      goalSpecificTips.push(
        "Thin crowded fruit clusters early. Fewer fruits per branch means bigger ones at harvest."
      );
    }
  }

  if (hasGoal(goals, "more-flowers", "bigger-blooms", "longer-bloom-season")) {
    fertWeeks = Math.max(fertWeeks - 1, 5);
    fertilizerAdjustment.push(
      "Use a bloom-boosting fertilizer as buds form. Skip high-nitrogen feeds, they grow leaves instead of flowers."
    );
    pruningAdjustment.push(
      "Deadhead spent blooms, and do shaping cuts right after a bloom cycle ends."
    );
    seasonalTasks.push(`${seasonLabel(season)}: pinch tips lightly to encourage branching and buds.`);
    goalSpecificTips.push("Remove faded flowers promptly to keep new ones coming.");
    goalSpecificTips.push("More sun, more flowers. Move it to the brightest spot it can handle.");
  }

  if (hasGoal(goals, "pollinator-attraction")) {
    goalSpecificTips.push("Avoid pesticides during bloom. Pollinators need open flowers.");
    seasonalTasks.push("Plant companion flowers nearby to draw more pollinators.");
  }

  if (hasGoal(goals, "prune-for-growth", "prune-for-shape", "better-shape")) {
    pruningAdjustment.push(
      hasGoal(goals, "prune-for-growth")
        ? "Prune with intent: cut just above outward-facing buds to trigger branching where you want it."
        : "Shape with small, frequent cuts. One big haircut stresses the plant and ruins the silhouette."
    );
    seasonalTasks.push(
      `${seasonLabel(season)}: review the Prune for Growth guide before you cut.`
    );
    goalSpecificTips.push("Photograph your plant before pruning so you can judge the result.");
    warnings.push("Never remove more than a third of the plant in one session.");
  }

  if (hasGoal(goals, "learn-this-plant")) {
    goalSpecificTips.push(
      `Get to know ${plant.species || "this plant"}: check its care guide in the Database and watch how it responds to water and light.`
    );
    seasonalTasks.push("Take a weekly photo. You'll learn this plant faster by comparing weeks.");
  }

  if (hasGoal(goals, "bonsai-training", "trunk-thickening", "styling-development", "show-preparation")) {
    fertWeeks = Math.min(fertWeeks + 2, 12);
    waterDays = Math.min(waterDays + 1, 10);
    fertilizerAdjustment.push(
      "Your goal is bonsai training, so use lighter, controlled feeding. Strength over speed."
    );
    pruningAdjustment.push(
      "Schedule wiring, shape pruning, and root-prune/repot cycles. Spring and early summer are prime windows."
    );
    seasonalTasks.push(`${seasonLabel(season)}: check wire tension and remove if biting in.`);
    goalSpecificTips.push("Photograph your tree from all angles to track styling progress.");
    if (hasGoal(goals, "trunk-thickening")) {
      goalSpecificTips.push("Let sacrifice branches run to thicken the trunk, then cut back.");
    }
  }

  if (hasGoal(goals, "privacy-screen", "more-shade")) {
    pruningAdjustment.push(
      "Hedge-prune lightly and often: trim sides to stay dense, control height once it reaches your target."
    );
    goalSpecificTips.push("Space plants for mature width to avoid overcrowding.");
    goalSpecificTips.push("Keep the base wider than the top so lower growth stays full.");
  }

  if (hasGoal(goals, "organic-care")) {
    fertilizerAdjustment.push("Use compost, worm castings, or fish emulsion instead of synthetic feeds.");
    soilAdjustment.push("Top-dress with compost twice a year for slow-release nutrition.");
  }

  if (hasGoal(goals, "repot-later")) {
    soilAdjustment.push("Plan repotting for early spring: refresh soil and check roots.");
    if (isNewPlant) {
      warnings.push("New plants often need 2 to 4 weeks to settle before repotting.");
    }
  }

  if (hasGoal(goals, "pest-prevention", "reduce-leaf-drop")) {
    seasonalTasks.push(`${seasonLabel(season)}: inspect undersides of leaves for pests.`);
    goalSpecificTips.push("Stable watering reduces indoor leaf drop. Avoid swings from wet to dry.");
  }

  if (hasGoal(goals, "better-leaf-color")) {
    fertilizerAdjustment.push("Ensure adequate light and micronutrients. Try iron or Epsom salt if leaves pale.");
    goalSpecificTips.push("Rotate the pot weekly for even light and color.");
  }

  if (hasGoal(goals, "keep-it-alive") && goals.length === 1) {
    goalSpecificTips.push("Focus on one habit: check soil moisture before every water.");
  }

  // Climate / ZIP hint
  goalSpecificTips.push(`Care tuned for ZIP ${zipCode} (${climateNote}).`);

  if (isNewPlant) {
    warnings.push("New plant. Go easy for the first two weeks while roots settle.");
  }

  // Two goals can produce the same advice. Show each tip once.
  const dedupedSeasonal = dedupeTipStrings(seasonalTasks, "seasonal");
  const dedupedWarnings = dedupeTipStrings(warnings, "general");
  const dedupedTips = dedupeTipStrings(goalSpecificTips, "general");

  return {
    wateringAdjustment:
      dedupeTipStrings(wateringAdjustment, "watering").join(" ") ||
      "Stick to your base watering rhythm.",
    fertilizerAdjustment:
      dedupeTipStrings(fertilizerAdjustment, "fertilizing").join(" ") ||
      "Follow your regular feeding schedule.",
    pruningAdjustment:
      dedupeTipStrings(pruningAdjustment, "pruning").join(" ") ||
      `Prune on schedule: ${pruneSchedule}.`,
    soilAdjustment:
      dedupeTipStrings(soilAdjustment, "soil").join(" ") ||
      "Use well-draining soil suited to your plant.",
    seasonalTasks:
      dedupedSeasonal.length > 0
        ? dedupedSeasonal
        : [`${seasonLabel(season)}: walk your garden and note new growth.`],
    warnings: dedupedWarnings,
    goalSpecificTips: dedupedTips,
    waterFrequencyDays: waterDays,
    fertilizeFrequencyWeeks: fertWeeks,
    pruneSchedule,
    wateringInstructions: base.wateringInstructions,
    fertilizingInstructions: base.fertilizingInstructions,
    pruningInstructions: base.pruningInstructions,
  };
}

/** Current growth stage label based on age, health, and goals. */
export function getCurrentStage(
  plant: Plant,
  goals: PlantGoal[]
): string {
  const profile = inferPlantProfile(plant.species, plant.name);
  const ageDays = Math.floor(
    (Date.now() - new Date(plant.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (plant.healthStatus === "critical") return "Recovery mode";
  if (ageDays < 30) return "Getting established";

  if (hasGoal(goals, "bonsai-training", "styling-development")) {
    if (ageDays < 180) return "Structure building";
    return "Refinement phase";
  }

  if (profile === "fruit") {
    if (ageDays < 365) return "Vegetative growth";
    if (hasGoal(goals, "more-fruit", "earlier-fruiting")) return "Pre-flowering";
    return "Mature growth";
  }

  if (profile === "flowering") {
    const month = new Date().getMonth();
    if (month >= 3 && month <= 8) return "Bloom season";
    return "Bud development";
  }

  if (ageDays < 180) return "Active growth";
  return "Maintenance phase";
}

/** Generate milestone roadmap for a plant. */
export function generateMilestonesForPlant(
  plantId: string,
  userId: string,
  plant: Plant,
  goals: PlantGoal[]
): PlantMilestone[] {
  const profile = inferPlantProfile(plant.species, plant.name);
  const now = new Date().toISOString();
  const templates: { title: string; description: string; daysOffset: number }[] = [];

  if (profile === "fruit" || hasGoal(goals, "more-fruit", "bigger-fruit")) {
    templates.push(
      { title: "Establish roots", description: "Plant settles in and roots spread.", daysOffset: 30 },
      { title: "First flush of new growth", description: "Fresh leaves or shoots appear.", daysOffset: 60 },
      { title: "First flower set", description: "Flower buds form. Fruit is on the way.", daysOffset: 180 },
      { title: "First fruit set", description: "Small fruit holds on the branch.", daysOffset: 240 },
      { title: "First harvest", description: "Pick your first ripe fruit.", daysOffset: 365 }
    );
  } else if (profile === "bonsai" || hasGoal(goals, "bonsai-training")) {
    templates.push(
      { title: "First wiring", description: "Initial branch positioning.", daysOffset: 45 },
      { title: "First structural prune", description: "Remove unwanted growth.", daysOffset: 90 },
      { title: "First repot", description: "Refresh soil and root prune lightly.", daysOffset: 180 },
      { title: "New branch development", description: "Back-budding and ramification.", daysOffset: 270 },
      { title: "Show-ready structure", description: "Tree holds its design from all angles.", daysOffset: 540 }
    );
  } else if (profile === "flowering" || hasGoal(goals, "more-flowers")) {
    templates.push(
      { title: "First buds", description: "Flower buds appear.", daysOffset: 45 },
      { title: "First bloom", description: "First flowers open.", daysOffset: 75 },
      { title: "Peak bloom", description: "Maximum flowers on the plant.", daysOffset: 90 },
      { title: "Deadhead cycle complete", description: "Spent blooms removed; plant recharges.", daysOffset: 120 }
    );
  } else {
    templates.push(
      { title: "Settling in", description: "Plant adapts to your home or garden.", daysOffset: 14 },
      { title: "Steady new growth", description: "Regular healthy leaves or shoots.", daysOffset: 45 },
      { title: "First care routine complete", description: "You completed a full water + feed cycle.", daysOffset: 60 },
      { title: "Thriving checkpoint", description: "Plant looks consistently healthy.", daysOffset: 120 }
    );
  }

  const created = new Date(plant.createdAt);

  return templates.map((t, i) => {
    const target = new Date(created);
    target.setDate(target.getDate() + t.daysOffset);
    return {
      id: crypto.randomUUID(),
      plantId,
      userId,
      title: t.title,
      description: t.description,
      targetDate: target.toISOString(),
      completedAt: null,
      status: i === 0 ? "in_progress" : "upcoming",
      createdAt: now,
    };
  });
}

/** Generate seasonal missions for a plant. */
export function generateMissionsForPlant(
  plantId: string,
  userId: string,
  plant: Plant,
  goals: PlantGoal[]
): PlantMission[] {
  const season = getCurrentSeason();
  const profile = inferPlantProfile(plant.species, plant.name);
  const now = new Date().toISOString();
  const missions: Omit<PlantMission, "id" | "createdAt">[] = [];

  missions.push({
    plantId,
    userId,
    title: `Check soil moisture on ${plant.name}`,
    description: "Stick a finger in the soil. Water only if the top inch is dry.",
    season,
    taskType: "water",
    rewardPoints: 10,
    completedAt: null,
    status: "active",
  });

  if (hasGoal(goals, "faster-growth", "more-fruit", "fuller-growth")) {
    missions.push({
      plantId,
      userId,
      title: `Take a growth photo of ${plant.name}`,
      description: "Snap a picture from the same angle to track progress.",
      season,
      taskType: "photo",
      rewardPoints: 15,
      completedAt: null,
      status: "active",
    });
  }

  if (hasGoal(goals, "pest-prevention", "health-recovery") || profile === "flowering") {
    missions.push({
      plantId,
      userId,
      title: `Inspect ${plant.name} for pests`,
      description: "Look under leaves for spots, webs, or sticky residue.",
      season,
      taskType: "inspect",
      rewardPoints: 12,
      completedAt: null,
      status: "active",
    });
  }

  if (hasGoal(goals, "more-fruit", "bigger-fruit") && (season === "spring" || season === "summer")) {
    missions.push({
      plantId,
      userId,
      title: `Feed ${plant.name} before fruiting season`,
      description: "Apply a potassium-rich fertilizer to support fruit development.",
      season,
      taskType: "fertilize",
      rewardPoints: 20,
      completedAt: null,
      status: "active",
    });
  }

  if (hasGoal(goals, "bonsai-training", "styling-development") && season === "spring") {
    missions.push({
      plantId,
      userId,
      title: `Review wiring on ${plant.name}`,
      description: "Check that wire isn't cutting into bark. Adjust or remove.",
      season,
      taskType: "prune",
      rewardPoints: 18,
      completedAt: null,
      status: "active",
    });
  }

  if (hasGoal(goals, "more-flowers", "longer-bloom-season")) {
    missions.push({
      plantId,
      userId,
      title: `Deadhead spent blooms on ${plant.name}`,
      description: "Remove faded flowers to encourage more blooms.",
      season,
      taskType: "prune",
      rewardPoints: 14,
      completedAt: null,
      status: "active",
    });
  }

  return missions.map((m) => ({
    ...m,
    id: crypto.randomUUID(),
    createdAt: now,
  }));
}

export function computeJourneyProgress(milestones: PlantMilestone[]): number {
  if (milestones.length === 0) return 0;
  const completed = milestones.filter((m) => m.status === "completed").length;
  const inProgress = milestones.some((m) => m.status === "in_progress") ? 0.5 : 0;
  return Math.round(((completed + inProgress) / milestones.length) * 100);
}

export function getNextMilestone(
  milestones: PlantMilestone[]
): PlantMilestone | null {
  const active =
    milestones.find((m) => m.status === "in_progress") ??
    milestones.find((m) => m.status === "upcoming");
  return active ?? null;
}

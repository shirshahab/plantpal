import type { Plant, SpeciesCareInput } from "@/lib/types";
import type {
  GoalBasedCarePlan,
  PlantGoal,
  PlantMilestone,
  PlantMission,
} from "@/lib/types/care-goals";
import { parseGallonSize } from "./plant-size";
import { defaultCareForSpecies } from "./care-defaults";

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
      "Container plants dry faster than in-ground — check soil moisture more often."
    );
    if (plant.potDiameterInches && plant.potDiameterInches <= 8) {
      waterDays = Math.max(waterDays - 1, 2);
      goalSpecificTips.push("Small pot — may need water every few days in heat.");
    }
  }

  const gallons = parseGallonSize(plant.nurseryContainerSize);
  if (gallons != null) {
    if (gallons <= 3) {
      waterDays = Math.max(waterDays - 1, 2);
      wateringAdjustment.push(
        `${plant.nurseryContainerSize} nursery stock — smaller root ball needs more frequent checks.`
      );
    } else if (gallons >= 15) {
      waterDays = Math.min(waterDays + 2, 14);
      wateringAdjustment.push(
        `${plant.nurseryContainerSize} tree — deep, less frequent watering once established.`
      );
    }
  }

  if (plant.sizeType === "height" && (plant.heightFeet ?? 0) >= 4) {
    wateringAdjustment.push("Taller specimen — deep soak to reach the full root zone.");
  }

  if (profile === "bonsai" && plant.potDiameterInches) {
    waterDays = Math.max(waterDays - 2, 1);
    goalSpecificTips.push(
      `Bonsai in ${plant.potDiameterInches}" pot — monitor daily; shallow soil dries quickly.`
    );
  }

  if (isNewPlant && plant.plantedDate) {
    waterDays = Math.max(waterDays - 1, 2);
    wateringAdjustment.push(
      "Newly planted — establishment watering: deep soak 2–3× per week for the first season."
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
      "Ease up on stress — keep soil evenly moist while your plant recovers."
    );
    warnings.push("Hold off on heavy pruning until health improves.");
    goalSpecificTips.push("Do this next: inspect leaves and stems for pests or rot.");
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
    goalSpecificTips.push("This week's mission: check for new growth at branch tips.");
  }

  if (hasGoal(goals, "more-fruit", "bigger-fruit", "earlier-fruiting")) {
    fertWeeks = Math.max(fertWeeks - 1, 4);
    fertilizerAdjustment.push(
      "Because your goal is more fruit, increase fertilizer attention during active growth — use a potassium-rich blend before bloom."
    );
    pruningAdjustment.push(
      "Avoid heavy pruning during bloom and fruit set — trim lightly after harvest instead."
    );
    seasonalTasks.push(
      `${seasonLabel(season)}: watch for flower buds and feed before fruit set.`
    );
    goalSpecificTips.push("Track flowering stages — first buds mean you're on track.");
    if (profile === "fruit") {
      warnings.push("Don't let soil dry completely while fruit is forming.");
    }
  }

  if (hasGoal(goals, "more-flowers", "bigger-blooms", "longer-bloom-season")) {
    fertWeeks = Math.max(fertWeeks - 1, 5);
    fertilizerAdjustment.push(
      "Use a bloom-boosting fertilizer as buds form for more and bigger flowers."
    );
    pruningAdjustment.push(
      "Deadhead spent blooms to extend the flowering season."
    );
    seasonalTasks.push(`${seasonLabel(season)}: pinch tips lightly to encourage branching and buds.`);
    goalSpecificTips.push("Remove faded flowers promptly to keep new ones coming.");
  }

  if (hasGoal(goals, "pollinator-attraction")) {
    goalSpecificTips.push("Avoid pesticides during bloom — pollinators need open flowers.");
    seasonalTasks.push("Plant companion flowers nearby to draw more pollinators.");
  }

  if (hasGoal(goals, "bonsai-training", "trunk-thickening", "styling-development", "show-preparation")) {
    fertWeeks = Math.min(fertWeeks + 2, 12);
    waterDays = Math.min(waterDays + 1, 10);
    fertilizerAdjustment.push(
      "Because your goal is bonsai training, use lighter fertilizer — strength over speed."
    );
    pruningAdjustment.push(
      "Schedule wiring and pruning windows — spring and early summer are prime times."
    );
    seasonalTasks.push(`${seasonLabel(season)}: check wire tension and remove if biting in.`);
    goalSpecificTips.push("Do this next: photograph your tree from all angles to track styling progress.");
    if (hasGoal(goals, "trunk-thickening")) {
      goalSpecificTips.push("Let sacrifice branches run to thicken the trunk, then cut back.");
    }
  }

  if (hasGoal(goals, "privacy-screen", "more-shade")) {
    pruningAdjustment.push("Shape lightly — let height and width develop for coverage.");
    goalSpecificTips.push("Space plants for mature width to avoid overcrowding.");
  }

  if (hasGoal(goals, "organic-care")) {
    fertilizerAdjustment.push("Use compost, worm castings, or fish emulsion instead of synthetic feeds.");
    soilAdjustment.push("Top-dress with compost twice a year for slow-release nutrition.");
  }

  if (hasGoal(goals, "repot-later")) {
    soilAdjustment.push("Plan repotting for early spring — refresh soil and check roots.");
    if (isNewPlant) {
      warnings.push("New plants often need 2–4 weeks to settle before repotting.");
    }
  }

  if (hasGoal(goals, "pest-prevention", "reduce-leaf-drop")) {
    seasonalTasks.push(`${seasonLabel(season)}: inspect undersides of leaves for pests.`);
    goalSpecificTips.push("Stable watering reduces indoor leaf drop — avoid swings wet to dry.");
  }

  if (hasGoal(goals, "better-leaf-color")) {
    fertilizerAdjustment.push("Ensure adequate light and micronutrients — iron or Epsom salt if leaves pale.");
    goalSpecificTips.push("Rotate the pot weekly for even light and color.");
  }

  if (hasGoal(goals, "keep-it-alive") && goals.length === 1) {
    goalSpecificTips.push("Focus on one habit: check soil moisture before every water.");
  }

  // Climate / ZIP hint
  goalSpecificTips.push(`Care tuned for ZIP ${zipCode} (${climateNote}).`);

  if (isNewPlant) {
    warnings.push("New plant — go easy for the first two weeks while roots settle.");
  }

  return {
    wateringAdjustment: wateringAdjustment.join(" ") || "Stick to your base watering rhythm.",
    fertilizerAdjustment:
      fertilizerAdjustment.join(" ") || "Follow your regular feeding schedule.",
    pruningAdjustment:
      pruningAdjustment.join(" ") || `Prune on schedule: ${pruneSchedule}.`,
    soilAdjustment: soilAdjustment.join(" ") || "Use well-draining soil suited to your plant.",
    seasonalTasks:
      seasonalTasks.length > 0
        ? seasonalTasks
        : [`${seasonLabel(season)}: walk your garden and note new growth.`],
    warnings,
    goalSpecificTips,
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
      { title: "First flower set", description: "Flower buds form — fruit is on the way.", daysOffset: 180 },
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
    description: "Stick a finger in the soil — water only if the top inch is dry.",
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
      description: "Check that wire isn't cutting into bark — adjust or remove.",
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

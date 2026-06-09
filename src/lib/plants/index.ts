export {
  getDashboardStats,
  needsWaterToday,
  needsFertilizerSoon,
  hasHealthAlert,
  daysSince,
} from "./utils";
export {
  generateGoalBasedCarePlan,
  generateMilestonesForPlant,
  generateMissionsForPlant,
  getCurrentStage,
  getNextMilestone,
  computeJourneyProgress,
  inferPlantProfile,
} from "./goal-care";
export { defaultCareForSpecies, DEFAULT_PLANT_IMAGE } from "./care-defaults";

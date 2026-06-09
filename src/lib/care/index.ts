/**
 * Care recommendation architecture — mock today, AI-ready tomorrow.
 *
 * Flow:
 * 1. User selects goals at onboarding → stored in user_plant_goals
 * 2. generateGoalBasedCarePlan() merges species base + goals + ZIP + health + age
 * 3. Missions/milestones generated from goals + plant profile
 * 4. Future: replace mock rules in goal-care.ts with OpenAI / care_schedules.ai_generated_data
 */

export type { CareRecommendationContext } from "./types";

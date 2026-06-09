import type { HealthStatus, Plant } from "@/lib/types";
import type { PlantGoal } from "@/lib/types/care-goals";

/** Context passed to AI care engine (future). */
export interface CareRecommendationContext {
  plant: Plant;
  goals: PlantGoal[];
  zipCode: string;
  healthStatus: HealthStatus;
  plantAgeDays: number;
  season: string;
  speciesProfile: string;
}

export interface AICareRecommendationRequest {
  context: CareRecommendationContext;
  /** When true, use mock rules instead of API */
  useMock: boolean;
}

/**
 * @deprecated Use pickPlantyMessage from planty-messages-system.ts
 */
import { pickPlantyMessage } from "@/lib/copy/planty-messages-system";

export function getPlantyMessage(): string {
  return pickPlantyMessage("dashboard_welcome").text;
}

export { pickPlantyMessage, type PlantyMessage, type PlantyMood } from "@/lib/copy/planty-messages-system";

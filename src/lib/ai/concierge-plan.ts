import type { ConciergePlanData, ConciergePlanRequest } from "@/lib/concierge/types";
import { mockConciergePlan } from "@/lib/concierge/mock-plan";
import { suggestLessons } from "@/lib/concierge/lesson-map";
import { chatJSON, visionJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT } from "./prompts";

const SCHEMA = `{
  "likely_issue": "string",
  "severity": "mild" | "moderate" | "serious",
  "root_cause": "string — 1-2 sentences",
  "confidence": "high" | "medium" | "low",
  "seven_day_plan": ["string — 5-7 daily/sequential actions for first week"],
  "weekly_plan": [
    {
      "week": 1,
      "title": "string",
      "actions": ["string"]
    }
  ],
  "what_to_avoid": ["string"],
  "when_to_rescan": "string",
  "products_needed": ["string"]
}`;

function buildPrompt(input: ConciergePlanRequest): string {
  return [
    `Create a guided recovery concierge plan for this plant problem.`,
    `Plant: ${input.nickname} (${input.species})`,
    `ZIP: ${input.zipCode}, Location: ${input.locationType}`,
    `Health: ${input.healthStatus}. Notes: ${input.healthNotes || "none"}`,
    `Goals: ${input.goals.join(", ") || "general care"}`,
    `Primary goal: ${input.primaryGoal || "not specified"}`,
    `Issue: ${input.issue}`,
    input.lastWateredAt ? `Last watered: ${input.lastWateredAt}` : "",
    input.lastFertilizedAt ? `Last fertilized: ${input.lastFertilizedAt}` : "",
    input.tasksCompleted != null ? `Tasks completed: ${input.tasksCompleted}` : "",
    input.healthScanCount != null ? `Health scans: ${input.healthScanCount}` : "",
    input.careHistorySummary ? `Care history: ${input.careHistorySummary}` : "",
    `Include a 7-day action list and a 4-week (30-day) weekly recovery plan.`,
    `Week 1 should stabilize. Week 2 monitor. Week 3 support recovery. Week 4 confirm.`,
    `Return JSON:\n${SCHEMA}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateConciergePlan(
  input: ConciergePlanRequest
): Promise<ConciergePlanData> {
  if (!isOpenAIConfigured()) {
    return mockConciergePlan(input);
  }

  const system = `${GARDENER_SYSTEM_PROMPT}\n\nYou are PlantPal Concierge — turn diagnoses into step-by-step recovery plans. Be practical and conservative. Never claim certainty.`;
  const prompt = buildPrompt(input);

  try {
    const raw = input.imageDataUrl
      ? await visionJSON<Omit<ConciergePlanData, "source" | "lessons">>(
          system,
          `${prompt}\n\nAnalyze the uploaded photo for visible symptoms.`,
          input.imageDataUrl
        )
      : await chatJSON<Omit<ConciergePlanData, "source" | "lessons">>(system, prompt);

    return {
      ...raw,
      lessons: suggestLessons(input.issue, input.species),
      source: "ai",
    };
  } catch {
    return mockConciergePlan(input);
  }
}

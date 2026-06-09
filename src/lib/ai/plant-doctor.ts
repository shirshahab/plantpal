import type { AIDoctorResponse, DoctorRequest } from "@/lib/types/ai";
import { getMockDoctorReport } from "@/lib/mock/doctor";
import { chatJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT } from "./prompts";

const DOCTOR_SCHEMA = `{
  "likely_issue": "string",
  "confidence": "high" | "medium" | "low",
  "possible_causes": ["string"],
  "what_to_do_today": "string",
  "what_to_avoid": "string",
  "when_to_check_back": "string",
  "severity": "mild" | "moderate" | "serious",
  "needs_professional_help": boolean
}`;

function mockDoctor(input: DoctorRequest): AIDoctorResponse {
  const legacy = getMockDoctorReport(input.issue, input.nickname);
  const lower = input.issue.toLowerCase();
  const serious =
    lower.includes("rot") ||
    lower.includes("dying") ||
    lower.includes("black") ||
    input.healthStatus === "critical";

  return {
    likely_issue: legacy.likelyIssue,
    confidence: legacy.confidence,
    possible_causes: [legacy.why],
    what_to_do_today: legacy.doToday,
    what_to_avoid: legacy.avoid,
    when_to_check_back: legacy.checkBack,
    severity: serious ? "serious" : input.healthStatus === "needs_attention" ? "moderate" : "mild",
    needs_professional_help: serious,
    source: "mock",
  };
}

export async function generateDoctorDiagnosis(
  input: DoctorRequest
): Promise<AIDoctorResponse> {
  if (!isOpenAIConfigured()) {
    return mockDoctor(input);
  }

  try {
    const raw = await chatJSON<Omit<AIDoctorResponse, "source">>(
      `${GARDENER_SYSTEM_PROMPT}\n\nYou diagnose plant problems from user descriptions. Return JSON:\n${DOCTOR_SCHEMA}`,
      `Diagnose this plant issue.

Plant: ${input.nickname} (${input.species})
ZIP: ${input.zipCode}
Location: ${input.locationType}
Health status: ${input.healthStatus}
Notes: ${input.healthNotes || "none"}
Goals: ${input.goals.join(", ") || "general care"}
Primary goal: ${input.primaryGoal || "not specified"}

User describes: ${input.issue}`
    );

    return { ...raw, source: "ai" };
  } catch {
    return mockDoctor(input);
  }
}

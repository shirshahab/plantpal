import type { ConciergePlanData, ConciergePlanRequest } from "./types";
import { suggestLessons } from "./lesson-map";

function inferSeverity(
  issue: string,
  healthStatus: ConciergePlanRequest["healthStatus"]
): ConciergePlanData["severity"] {
  const lower = issue.toLowerCase();
  if (
    lower.includes("rot") ||
    lower.includes("dying") ||
    lower.includes("black") ||
    healthStatus === "critical"
  ) {
    return "serious";
  }
  if (
    lower.includes("yellow") ||
    lower.includes("pest") ||
    lower.includes("wilting") ||
    healthStatus === "needs_attention"
  ) {
    return "moderate";
  }
  return "mild";
}

function buildYellowLeafPlan(input: ConciergePlanRequest): ConciergePlanData {
  const severity = inferSeverity(input.issue, input.healthStatus);
  return {
    likely_issue: "Overwatering or uneven soil moisture",
    severity,
    root_cause:
      "Soil may be staying wet too long, limiting oxygen to roots. Yellowing often appears on older leaves first when roots are stressed.",
    confidence: "medium",
    seven_day_plan: [
      "Check soil moisture 2 inches deep. Do not guess from the surface",
      "Deep water once if dry; skip watering if soil is still damp",
      "Remove clearly damaged or yellow leaves to reduce stress",
      "Do not fertilize yet. Stressed roots cannot absorb nutrients",
      "Improve drainage if water sits in saucer or soil smells sour",
      "Note which leaves are affected (old vs new growth)",
      "Take a baseline photo for comparison",
    ],
    weekly_plan: [
      {
        week: 1,
        title: "Stabilize & assess",
        actions: [
          "Check soil moisture daily at root depth",
          "Deep water once if dry; otherwise hold off",
          "Remove damaged leaves",
          "Do not fertilize yet",
        ],
      },
      {
        week: 2,
        title: "Monitor recovery",
        actions: [
          "Upload a new progress photo",
          "Check for new green growth at tips",
          "Adjust watering: longer dry window if soil stayed wet",
          "Inspect for pests on leaf undersides",
        ],
      },
      {
        week: 3,
        title: "Support growth",
        actions: [
          "Light balanced fertilizer only if new growth looks healthy",
          "Continue deep watering on a consistent schedule",
          "Snip any remaining fully yellow leaves",
        ],
      },
      {
        week: 4,
        title: "Confirm recovery",
        actions: [
          "Compare week-1 vs week-4 photos",
          "Resume normal care schedule if trend is improving",
          "Rescan if yellowing spreads to new growth",
        ],
      },
    ],
    what_to_avoid: [
      "Do not fertilize while the plant is actively declining",
      "Avoid repotting during acute stress",
      "Do not increase watering without checking soil first",
      "Skip harsh pruning. Remove only damaged tissue",
    ],
    when_to_rescan: "Rescan in 7 days, or sooner if yellowing spreads to new leaves.",
    products_needed: [
      "Moisture meter or wooden skewer for soil checks",
      "Clean pruning shears (rubbing alcohol wipe)",
      "Optional: insecticidal soap if pests found",
    ],
    lessons: suggestLessons(input.issue, input.species),
    source: "mock",
  };
}

function buildPestPlan(input: ConciergePlanRequest): ConciergePlanData {
  const severity = inferSeverity(input.issue, input.healthStatus);
  return {
    likely_issue: "Sap-sucking pests (aphids, spider mites, or scale)",
    severity,
    root_cause:
      "Pests drain plant fluids and leave sticky residue or stippling. Stressed plants in dry indoor air are especially vulnerable.",
    confidence: "high",
    seven_day_plan: [
      "Inspect leaf undersides and stem joints with a phone flashlight",
      "Isolate from other plants if infestation is visible",
      "Spray insecticidal soap in the evening (avoid midday sun)",
      "Wipe leaves gently with damp cloth after treatment",
      "Repeat treatment in 3 days if pests persist",
      "Do not fertilize until pest pressure drops",
      "Photograph affected areas for tracking",
    ],
    weekly_plan: [
      {
        week: 1,
        title: "Treat & isolate",
        actions: [
          "Identify pest type on leaf undersides",
          "Apply insecticidal soap or neem (evening)",
          "Isolate plant if possible",
          "Remove heavily infested leaves",
        ],
      },
      {
        week: 2,
        title: "Follow-up treatment",
        actions: [
          "Re-inspect and repeat soap/neem if needed",
          "Upload new photo of worst-affected area",
          "Increase humidity slightly for mite-prone plants",
        ],
      },
      {
        week: 3,
        title: "Recovery support",
        actions: [
          "Light fertilizer if new growth is clean",
          "Continue weekly pest checks",
          "Clean surrounding area and pots",
        ],
      },
      {
        week: 4,
        title: "Prevention",
        actions: [
          "Monthly inspect routine",
          "Resume normal care if clear for 2 weeks",
          "Rescan if sticky residue returns",
        ],
      },
    ],
    what_to_avoid: [
      "Do not use harsh systemic chemicals on edible plants without label approval",
      "Avoid over-watering while treating. Wet foliage overnight can invite fungus",
      "Do not compost infested leaves",
    ],
    when_to_rescan: "Rescan in 3–5 days after first treatment to confirm pests are declining.",
    products_needed: [
      "Insecticidal soap or horticultural oil",
      "Spray bottle",
      "Magnifying glass or phone macro mode",
      "Sticky traps (optional for flying pests)",
    ],
    lessons: suggestLessons(input.issue, input.species),
    source: "mock",
  };
}

function buildGeneralPlan(input: ConciergePlanRequest): ConciergePlanData {
  const severity = inferSeverity(input.issue, input.healthStatus);
  return {
    likely_issue: "General plant stress: water, light, or root imbalance",
    severity,
    root_cause: `${input.nickname} may be out of sync with its ideal care rhythm for ${input.locationType} conditions in ZIP ${input.zipCode}.`,
    confidence: "medium",
    seven_day_plan: [
      "Review last watering date and soil moisture at root depth",
      "Confirm sun exposure matches plant needs",
      "Remove dead or damaged tissue only",
      "Log observations daily in PlantPal",
      "Avoid fertilizing until stress signs stabilize",
      "Check drainage and pot size if container-grown",
      "Take a baseline photo",
    ],
    weekly_plan: [
      {
        week: 1,
        title: "Diagnose & stabilize",
        actions: [
          "Audit water, light, and drainage",
          "Remove damaged leaves",
          "Hold fertilizer",
          "Baseline photo",
        ],
      },
      {
        week: 2,
        title: "Adjust care",
        actions: [
          "Apply one care change at a time",
          "Upload progress photo",
          "Complete suggested daily tasks in PlantPal",
        ],
      },
      {
        week: 3,
        title: "Support recovery",
        actions: [
          "Light feed if improving",
          "Fine-tune watering schedule",
          "Check for secondary pests",
        ],
      },
      {
        week: 4,
        title: "Evaluate",
        actions: [
          "Compare photos week 1 vs 4",
          "Mark plan complete if stable",
          "Rescan if no improvement",
        ],
      },
    ],
    what_to_avoid: [
      "Do not change everything at once. Hard to know what helped",
      "Avoid repotting during active stress",
      "Skip heavy pruning until health stabilizes",
    ],
    when_to_rescan: "Rescan in 7–10 days with a new photo.",
    products_needed: [
      "Soil moisture probe or skewer",
      "Pruning shears",
      "Balanced liquid fertilizer (week 3+ only if improving)",
    ],
    lessons: suggestLessons(input.issue, input.species),
    source: "mock",
  };
}

export function mockConciergePlan(input: ConciergePlanRequest): ConciergePlanData {
  const lower = input.issue.toLowerCase();
  if (lower.includes("yellow") || lower.includes("leaf")) {
    return buildYellowLeafPlan(input);
  }
  if (
    lower.includes("pest") ||
    lower.includes("bug") ||
    lower.includes("aphid") ||
    lower.includes("mite")
  ) {
    return buildPestPlan(input);
  }
  return buildGeneralPlan(input);
}

export function planTitle(data: ConciergePlanData, nickname: string): string {
  return `${nickname}: ${data.likely_issue}`;
}

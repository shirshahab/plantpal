import type { DoctorReport } from "@/lib/types/phase6";

export function getMockDoctorReport(issue: string, plantName: string): DoctorReport {
  const lower = issue.toLowerCase();
  if (lower.includes("yellow") || lower.includes("leaf")) {
    return {
      likelyIssue: "Overwatering or nitrogen deficiency",
      confidence: "medium",
      why: `${plantName} may be sitting in wet soil or lacking nutrients for new leaf growth.`,
      doToday: "Check soil 2 inches down. If wet, skip watering and improve drainage. If dry, water deeply.",
      avoid: "Do not fertilize until you confirm soil moisture is balanced.",
      checkBack: "Re-check leaves in 5–7 days. New growth should look greener.",
    };
  }
  if (lower.includes("pest") || lower.includes("bug")) {
    return {
      likelyIssue: "Sap-sucking pests (aphids or spider mites)",
      confidence: "high",
      why: "Small insects cluster on new growth and cause stippling or curling.",
      doToday: "Inspect leaf undersides. Spray with insecticidal soap in the evening.",
      avoid: "Avoid harsh chemicals on stressed plants.",
      checkBack: "Inspect again in 3 days. Repeat treatment if needed.",
    };
  }
  return {
    likelyIssue: "General stress: likely water or light imbalance",
    confidence: "medium",
    why: `${plantName} shows signs that care conditions may not match its needs right now.`,
    doToday: "Review watering schedule and sun exposure. Log what you observe today.",
    avoid: "Avoid repotting or heavy pruning while the plant is stressed.",
    checkBack: "Follow up in one week with a new photo to compare progress.",
  };
}

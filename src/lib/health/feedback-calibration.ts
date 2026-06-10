/**
 * Feedback calibration — pure helpers shared by server and client.
 *
 * When users tell PlantPal a past diagnosis was right or wrong, future
 * confidence for that issue is nudged accordingly. Estimates only get more
 * honest over time — never more certain than the track record supports.
 */
import type { FeedbackSignals, ProDiagnosis } from "@/lib/types/health";

const MIN_SAMPLES = 2;

/** Adjust diagnosis confidence using the user's past feedback accuracy. */
export function applyFeedbackCalibration(
  diagnosis: ProDiagnosis,
  signals: FeedbackSignals | null | undefined
): ProDiagnosis {
  if (!diagnosis.issueId || !signals?.issueStats) return diagnosis;

  const stats = signals.issueStats[diagnosis.issueId];
  if (!stats) return diagnosis;

  const total = stats.correct + stats.wrong;
  if (total < MIN_SAMPLES) return diagnosis;

  const accuracy = stats.correct / total;

  if (accuracy <= 0.4) {
    return {
      ...diagnosis,
      confidence: Math.max(20, diagnosis.confidence - 10),
      confidenceTier:
        diagnosis.confidenceTier === "high" ? "medium" : diagnosis.confidenceTier,
      calibrationNote: `You've marked past ${diagnosis.likelyIssue.toLowerCase()} diagnoses as incorrect, so confidence was lowered. Consider the alternative causes carefully.`,
    };
  }

  if (accuracy >= 0.8) {
    return {
      ...diagnosis,
      confidence: Math.min(95, diagnosis.confidence + 5),
      calibrationNote: `Past ${diagnosis.likelyIssue.toLowerCase()} diagnoses you confirmed were accurate, supporting this call.`,
    };
  }

  return diagnosis;
}

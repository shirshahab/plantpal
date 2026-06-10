/**
 * Second opinion system — cross-checks the primary diagnosis against
 * independent sources before showing it to the user:
 *
 *   1. OpenAI Vision      (primary when available)
 *   2. Rule-based engine  (always runs — symptom/environment pattern match)
 *   3. Pl@ntNet           (species verification from the first photo)
 *
 * Agreement raises confidence slightly; disagreement is surfaced honestly
 * instead of hidden.
 */
import type { PlantNetSuggestion } from "@/lib/types/integrations";
import type {
  ProDiagnosis,
  SecondOpinion,
  SecondOpinionSource,
} from "@/lib/types/health";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function speciesSimilar(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const genusA = na.split(" ")[0] ?? "";
  const genusB = nb.split(" ")[0] ?? "";
  return genusA.length > 2 && genusA === genusB;
}

function issuesAgree(a: ProDiagnosis, b: ProDiagnosis): boolean {
  if (a.issueId && b.issueId) return a.issueId === b.issueId;
  return normalize(a.likelyIssue) === normalize(b.likelyIssue);
}

export interface BuildSecondOpinionArgs {
  primary: ProDiagnosis;
  /** Rule-based diagnosis — always available. */
  rules: ProDiagnosis;
  /** Pl@ntNet species suggestions from the first photo, if checked. */
  plantnet: PlantNetSuggestion[] | null;
  userSpecies: string;
}

export function buildSecondOpinion({
  primary,
  rules,
  plantnet,
  userSpecies,
}: BuildSecondOpinionArgs): SecondOpinion {
  const sources: SecondOpinionSource[] = [];
  const primaryIsAi = primary.source === "ai";

  sources.push({
    source: primaryIsAi ? "openai" : "rules",
    label: primaryIsAi ? "Photo analysis" : "Pattern matching",
    finding: primary.likelyIssue,
    agreesWithPrimary: null,
  });

  let rulesAgree: boolean | null = null;
  if (primaryIsAi) {
    rulesAgree = issuesAgree(primary, rules);
    sources.push({
      source: "rules",
      label: "Pattern matching",
      finding: rules.likelyIssue,
      agreesWithPrimary: rulesAgree,
    });
  }

  if (plantnet && plantnet.length > 0) {
    const top = plantnet[0];
    const speciesMatch =
      top.score >= 25 &&
      (speciesSimilar(top.species, userSpecies) ||
        top.commonNames.some((c) => speciesSimilar(c, userSpecies)));
    sources.push({
      source: "plantnet",
      label: "Pl@ntNet species check",
      finding: speciesMatch
        ? `Photos look consistent with ${userSpecies}.`
        : `Top photo match was ${top.commonNames[0] ?? top.species} — double-check the species entered.`,
      agreesWithPrimary: speciesMatch,
    });
  }

  let agreementLevel: SecondOpinion["agreementLevel"];
  let note: string;

  if (!primaryIsAi) {
    agreementLevel = "single_source";
    note =
      "This diagnosis is from PlantPal's symptom pattern engine. Adding clear photos enables photo analysis as a second source.";
  } else if (rulesAgree) {
    agreementLevel = "strong";
    note =
      "Photo analysis and PlantPal's independent symptom pattern check reached the same conclusion.";
  } else {
    const rulesUseful = rules.issueId !== null;
    agreementLevel = rulesUseful ? "partial" : "low";
    note = rulesUseful
      ? `The symptom pattern check leaned toward ${rules.likelyIssue.toLowerCase()} instead. Both are listed in possible causes — monitor for distinguishing signs before treating aggressively.`
      : "The symptom pattern check couldn't independently confirm this — treat the diagnosis as a working hypothesis and rescan after the first steps.";
  }

  return { sources, agreementLevel, note };
}

/** Confidence adjustment from cross-source agreement. */
export function agreementConfidenceDelta(
  agreementLevel: SecondOpinion["agreementLevel"]
): number {
  switch (agreementLevel) {
    case "strong":
      return 5;
    case "partial":
      return -5;
    case "low":
      return -10;
    default:
      return 0;
  }
}

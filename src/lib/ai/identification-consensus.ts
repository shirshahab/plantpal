import type { PlantIdentificationResponse } from "@/lib/types/ai";
import type { PlantNetSuggestion } from "@/lib/types/integrations";
import { isOpenAIConfigured } from "./openai";
import { buildFriendlyHeadline } from "@/lib/scanner/identification-copy";

export interface IdentificationMatch {
  common_name: string;
  scientific_name: string;
  confidence_score: number;
}

function normalizeSpecies(name: string): string {
  return name
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function genusOf(name: string): string {
  const parts = normalizeSpecies(name).split(" ");
  return parts[0] ?? "";
}

function speciesSimilar(a: string, b: string): boolean {
  const na = normalizeSpecies(a);
  const nb = normalizeSpecies(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  return genusOf(na) === genusOf(nb) && genusOf(na).length > 2;
}

/** True when OpenAI primary ID and Pl@ntNet top hit clearly disagree. */
export function detectProviderDisagreement(
  result: PlantIdentificationResponse,
  plantnet: PlantNetSuggestion[]
): boolean {
  if (plantnet.length === 0) return false;
  if (result.identification_provider !== "openai") return false;
  if (!isOpenAIConfigured()) return false;

  const top = plantnet[0];
  if (top.score < 25) return false;

  return !speciesSimilar(result.scientific_name, top.species);
}

export function buildTopMatches(
  result: PlantIdentificationResponse,
  plantnet: PlantNetSuggestion[],
  providersDisagree = false
): IdentificationMatch[] {
  const seen = new Set<string>();
  const matches: IdentificationMatch[] = [];

  function push(common: string, scientific: string, score: number) {
    const key = normalizeSpecies(scientific);
    if (!key || seen.has(key)) return;
    seen.add(key);
    matches.push({
      common_name: common,
      scientific_name: scientific,
      confidence_score: Math.round(Math.min(100, Math.max(0, score))),
    });
  }

  push(result.common_name, result.scientific_name, result.confidence_score);

  for (const alt of result.top_matches ?? []) {
    push(alt.common_name, alt.scientific_name, alt.confidence_score);
  }

  for (const s of result.plantid_suggestions ?? []) {
    push(s.commonNames[0] ?? s.scientificName, s.scientificName, s.probability);
  }

  // Do not merge Pl@ntNet into alternates when sources clearly disagree.
  if (!providersDisagree) {
    for (const s of plantnet) {
      push(s.commonNames[0] ?? s.species, s.species, s.score);
    }
  }

  return matches.slice(0, 3);
}

export function finalizeIdentification(
  result: PlantIdentificationResponse,
  plantnet: PlantNetSuggestion[],
  plantnetEnabled: boolean
): PlantIdentificationResponse {
  const providers_disagree = detectProviderDisagreement(result, plantnet);
  const top_matches = buildTopMatches(result, plantnet, providers_disagree);
  const low_confidence =
    result.low_confidence ||
    result.confidence_score < 70 ||
    providers_disagree;

  const withConfidence = {
    ...result,
    top_matches,
    providers_disagree,
    plantnet_available: plantnetEnabled && plantnet.length > 0,
    plantnet_configured: plantnetEnabled,
    low_confidence,
    not_fully_confident: low_confidence,
    identification_rationale:
      result.identification_rationale ||
      `Visual features in your photo best match ${result.common_name} (${result.scientific_name}).`,
    common_lookalikes:
      result.common_lookalikes?.length ? result.common_lookalikes : inferLookalikes(top_matches),
  };

  return {
    ...withConfidence,
    friendly_headline:
      result.friendly_headline ?? buildFriendlyHeadline(withConfidence),
  };
}

function inferLookalikes(matches: IdentificationMatch[]): string[] {
  return matches.slice(1, 4).map((m) => m.common_name);
}

export { speciesSimilar, normalizeSpecies };

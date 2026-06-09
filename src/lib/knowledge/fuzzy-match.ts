/**
 * Fuzzy matching for plant search — "Did you mean…?" suggestions
 * for misspelled plant names.
 */
import { PLANT_SPECIES } from "./seed";

/** Common plant-name misspellings → corrections (word-level). */
const TYPO_CORRECTIONS: Record<string, string> = {
  avacado: "avocado",
  avocato: "avocado",
  bouganvilla: "bougainvillea",
  bouganvillea: "bougainvillea",
  bougainvilla: "bougainvillea",
  bugambilia: "bougainvillea",
  japaneese: "japanese",
  japenese: "japanese",
  lemmon: "lemon",
  lemmen: "lemon",
  monestera: "monstera",
  monstero: "monstera",
  tomatoe: "tomato",
  basill: "basil",
  lavendar: "lavender",
  hydranga: "hydrangea",
  hydrangia: "hydrangea",
  succulant: "succulent",
  ficcus: "ficus",
  pothoes: "pothos",
  orchad: "orchid",
  rosemarry: "rosemary",
};

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Apply word-level typo corrections. Returns null if nothing changed. */
function applyTypoCorrections(query: string): string | null {
  const words = normalize(query).split(" ");
  let changed = false;
  const corrected = words.map((w) => {
    if (TYPO_CORRECTIONS[w]) {
      changed = true;
      return TYPO_CORRECTIONS[w];
    }
    return w;
  });
  return changed ? corrected.join(" ") : null;
}

/** Find a seed species whose common name best matches the (corrected) query. */
function bestSeedMatch(query: string): string | null {
  const q = normalize(query);
  if (q.length < 3) return null;

  let best: { name: string; score: number } | null = null;

  for (const species of PLANT_SPECIES) {
    const name = normalize(species.common_name);

    // Direct containment — exact-enough match
    if (name.includes(q) || q.includes(name)) {
      return species.common_name;
    }

    // Compare against the full name and each word in it
    const candidates = [name, ...name.split(" ")];
    for (const candidate of candidates) {
      if (candidate.length < 4) continue;
      const distance = levenshtein(q, candidate);
      const maxAllowed = Math.max(1, Math.floor(candidate.length / 4));
      if (distance <= maxAllowed) {
        const score = distance / candidate.length;
        if (!best || score < best.score) {
          best = { name: species.common_name, score };
        }
      }
    }
  }

  return best?.name ?? null;
}

/**
 * Suggest a corrected plant name for a likely-misspelled query.
 * Returns null when the query already matches existing results well.
 */
export function suggestSpeciesCorrection(
  query: string,
  existingResultNames: string[] = []
): string | null {
  const q = normalize(query);
  if (q.length < 4) return null;

  // If results already contain a name matching the query, no correction needed
  const hasGoodResult = existingResultNames.some((n) => {
    const name = normalize(n);
    return name.includes(q) || q.includes(name.split(" ")[0]);
  });
  if (hasGoodResult) return null;

  // 1) Known typo dictionary
  const corrected = applyTypoCorrections(query);
  if (corrected) {
    return bestSeedMatch(corrected) ?? capitalizeWords(corrected);
  }

  // 2) Fuzzy match against the internal species list
  return bestSeedMatch(query);
}

function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

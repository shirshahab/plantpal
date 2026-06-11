/** Default care values by species — platform-agnostic business logic. */

export interface BaseCareValues {
  waterFrequencyDays: number;
  fertilizeFrequencyWeeks: number;
  pruneSchedule: string;
  wateringInstructions: string;
  fertilizingInstructions: string;
  pruningInstructions: string;
}

interface CareRule {
  match: RegExp;
  care: BaseCareValues;
}

/** Keyword-matched care rules, checked in order — most specific first. */
const CARE_RULES: CareRule[] = [
  {
    match: /bougainvillea|bouganvill/,
    care: {
      waterFrequencyDays: 7,
      fertilizeFrequencyWeeks: 4,
      pruneSchedule: "After blooming",
      wateringInstructions: "Let soil dry between waterings. Bougainvillea blooms best slightly dry.",
      fertilizingInstructions: "Fertilize during the growing season with a bloom-boosting feed.",
      pruningInstructions: "Prune after each bloom cycle to shape and encourage new flowers.",
    },
  },
  {
    match: /fiddle.?leaf|ficus lyrata/,
    care: {
      waterFrequencyDays: 7,
      fertilizeFrequencyWeeks: 6,
      pruneSchedule: "As needed",
      wateringInstructions: "Water when top 1–2 inches of soil are dry. Avoid drafts.",
      fertilizingInstructions: "Diluted liquid fertilizer monthly in spring and summer.",
      pruningInstructions: "Trim to shape; rotate the plant weekly for even growth.",
    },
  },
  {
    match: /citrus|lemon|lime\b|orange|grapefruit|kumquat/,
    care: {
      waterFrequencyDays: 3,
      fertilizeFrequencyWeeks: 6,
      pruneSchedule: "Late winter",
      wateringInstructions: "Deep water when top inch of soil dries. Protect from frost.",
      fertilizingInstructions: "Citrus fertilizer during the growing season, every 6 weeks.",
      pruningInstructions: "Prune in late winter to shape and remove crossing branches.",
    },
  },
  {
    match: /avocado|persea/,
    care: {
      waterFrequencyDays: 4,
      fertilizeFrequencyWeeks: 6,
      pruneSchedule: "Early spring",
      wateringInstructions: "Deep, infrequent watering. Let top few inches dry. Roots hate soggy soil.",
      fertilizingInstructions: "Citrus/avocado fertilizer with zinc during growing season.",
      pruningInstructions: "Light shaping in early spring; avoid heavy cuts.",
    },
  },
  {
    match: /japanese maple|acer palmatum|maple/,
    care: {
      waterFrequencyDays: 4,
      fertilizeFrequencyWeeks: 10,
      pruneSchedule: "Late winter (dormant)",
      wateringInstructions: "Keep soil consistently moist but well-drained; protect from hot afternoon sun.",
      fertilizingInstructions: "Light spring feeding with slow-release fertilizer. Easy does it.",
      pruningInstructions: "Prune while dormant in late winter; remove dead or crossing branches.",
    },
  },
  {
    match: /ficus|fig/,
    care: {
      waterFrequencyDays: 7,
      fertilizeFrequencyWeeks: 8,
      pruneSchedule: "As needed",
      wateringInstructions: "Water when top 2 inches of soil are dry.",
      fertilizingInstructions: "Diluted liquid fertilizer monthly in spring/summer.",
      pruningInstructions: "Trim to control height as needed.",
    },
  },
  {
    match: /monstera|pothos|philodendron/,
    care: {
      waterFrequencyDays: 7,
      fertilizeFrequencyWeeks: 6,
      pruneSchedule: "As needed",
      wateringInstructions: "Water when top 1–2 inches of soil are dry. Bright indirect light.",
      fertilizingInstructions: "Balanced liquid feed monthly during growing season.",
      pruningInstructions: "Trim leggy vines to encourage fuller growth.",
    },
  },
  {
    match: /snake plant|sansevieria|dracaena|zz plant|zamioculcas/,
    care: {
      waterFrequencyDays: 14,
      fertilizeFrequencyWeeks: 12,
      pruneSchedule: "Rarely needed",
      wateringInstructions: "Let soil dry completely between waterings. Overwatering is the main killer.",
      fertilizingInstructions: "Light feeding 2–3 times a year is plenty.",
      pruningInstructions: "Remove damaged leaves at the base.",
    },
  },
  {
    match: /succulent|cactus|echeveria|aloe|agave|jade/,
    care: {
      waterFrequencyDays: 12,
      fertilizeFrequencyWeeks: 12,
      pruneSchedule: "Rarely needed",
      wateringInstructions: "Soak and dry: water deeply, then let soil dry fully.",
      fertilizingInstructions: "Diluted cactus fertilizer a few times in spring/summer.",
      pruningInstructions: "Remove dead leaves; propagate offsets as desired.",
    },
  },
  {
    match: /fern|calathea|maranta/,
    care: {
      waterFrequencyDays: 3,
      fertilizeFrequencyWeeks: 8,
      pruneSchedule: "As needed",
      wateringInstructions: "Keep soil consistently moist; loves humidity. Mist or use a pebble tray.",
      fertilizingInstructions: "Half-strength liquid feed monthly in growing season.",
      pruningInstructions: "Trim browned fronds at the base.",
    },
  },
  {
    match: /orchid|phalaenopsis/,
    care: {
      waterFrequencyDays: 7,
      fertilizeFrequencyWeeks: 4,
      pruneSchedule: "After blooming",
      wateringInstructions: "Water weekly; let bark mix dry slightly. Never let roots sit in water.",
      fertilizingInstructions: "Weakly, weekly: diluted orchid feed during growth.",
      pruningInstructions: "Cut spent flower spikes above a node to encourage reblooming.",
    },
  },
  {
    match: /rose\b|roses|rosa\b/,
    care: {
      waterFrequencyDays: 4,
      fertilizeFrequencyWeeks: 4,
      pruneSchedule: "Late winter / early spring",
      wateringInstructions: "Deep water at the base. Avoid wetting leaves to prevent black spot.",
      fertilizingInstructions: "Rose fertilizer every 4–6 weeks during bloom season.",
      pruningInstructions: "Hard prune in late winter; deadhead spent blooms all season.",
    },
  },
  {
    match: /lavender|lavandula|rosemary|rosmarinus|sage\b|salvia|thyme/,
    care: {
      waterFrequencyDays: 10,
      fertilizeFrequencyWeeks: 12,
      pruneSchedule: "After flowering",
      wateringInstructions: "Drought-tolerant. Water deeply but infrequently. Needs sharp drainage.",
      fertilizingInstructions: "Minimal feeding; too much fertilizer reduces fragrance.",
      pruningInstructions: "Shear lightly after flowering; never cut into old wood.",
    },
  },
  {
    match: /hydrangea/,
    care: {
      waterFrequencyDays: 3,
      fertilizeFrequencyWeeks: 6,
      pruneSchedule: "After blooming",
      wateringInstructions: "Keep soil consistently moist. Hydrangeas wilt fast in heat.",
      fertilizingInstructions: "Balanced feed in spring; soil pH controls bloom color.",
      pruningInstructions: "Prune right after flowering. Many varieties bloom on old wood.",
    },
  },
  {
    match: /blueberry/,
    care: {
      waterFrequencyDays: 3,
      fertilizeFrequencyWeeks: 6,
      pruneSchedule: "Late winter",
      wateringInstructions: "Keep soil evenly moist. Shallow roots dry quickly. Needs acidic soil.",
      fertilizingInstructions: "Acid-loving plant fertilizer (azalea/camellia type) in spring.",
      pruningInstructions: "Prune oldest canes in late winter to keep plants productive.",
    },
  },
  {
    match: /tomato|solanum lycopersicum|pepper|cucumber|squash|zucchini/,
    care: {
      waterFrequencyDays: 2,
      fertilizeFrequencyWeeks: 3,
      pruneSchedule: "Ongoing through season",
      wateringInstructions: "Consistent deep watering. Irregular water causes blossom end rot and splitting.",
      fertilizingInstructions: "Vegetable fertilizer every 2–3 weeks once fruiting starts.",
      pruningInstructions: "Pinch suckers and remove lower leaves for airflow.",
    },
  },
  {
    match: /basil|ocimum|cilantro|parsley|mint\b|mentha|herb/,
    care: {
      waterFrequencyDays: 2,
      fertilizeFrequencyWeeks: 4,
      pruneSchedule: "Harvest regularly",
      wateringInstructions: "Keep soil lightly moist; herbs in pots dry out fast.",
      fertilizingInstructions: "Light liquid feed monthly. Overfeeding dulls flavor.",
      pruningInstructions: "Pinch tips often to keep plants bushy; remove flower buds.",
    },
  },
  {
    match: /palm|areca|kentia|majesty/,
    care: {
      waterFrequencyDays: 6,
      fertilizeFrequencyWeeks: 8,
      pruneSchedule: "As needed",
      wateringInstructions: "Water when top inch is dry; palms like humidity and bright indirect light.",
      fertilizingInstructions: "Palm fertilizer with micronutrients in growing season.",
      pruningInstructions: "Remove fully brown fronds only. Green fronds feed the plant.",
    },
  },
  {
    match: /bird of paradise|strelitzia/,
    care: {
      waterFrequencyDays: 6,
      fertilizeFrequencyWeeks: 4,
      pruneSchedule: "As needed",
      wateringInstructions: "Water when top 2 inches dry; loves bright light and warmth.",
      fertilizingInstructions: "Feed every 4 weeks in spring/summer for big leaves and blooms.",
      pruningInstructions: "Remove tattered leaves at the base.",
    },
  },
  {
    match: /bonsai|juniper/,
    care: {
      waterFrequencyDays: 2,
      fertilizeFrequencyWeeks: 4,
      pruneSchedule: "Spring and early summer",
      wateringInstructions: "Check daily. Shallow bonsai pots dry quickly. Water when surface dries.",
      fertilizingInstructions: "Diluted bonsai fertilizer every 2–4 weeks in growing season.",
      pruningInstructions: "Pinch and prune new growth regularly to maintain shape.",
    },
  },
  {
    match: /boxwood|buxus|hedge|privet/,
    care: {
      waterFrequencyDays: 5,
      fertilizeFrequencyWeeks: 10,
      pruneSchedule: "Late spring and midsummer",
      wateringInstructions: "Deep water weekly until established; mulch to retain moisture.",
      fertilizingInstructions: "Slow-release shrub fertilizer in early spring.",
      pruningInstructions: "Shear in late spring and again midsummer for crisp shape.",
    },
  },
  {
    match: /banana|musa/,
    care: {
      waterFrequencyDays: 2,
      fertilizeFrequencyWeeks: 3,
      pruneSchedule: "Remove spent leaves",
      wateringInstructions: "Heavy drinker. Keep soil consistently moist in warm weather.",
      fertilizingInstructions: "Feed generously every 2–4 weeks; bananas are hungry plants.",
      pruningInstructions: "Cut away dead leaves and spent stalks after fruiting.",
    },
  },
  {
    match: /begonia/,
    care: {
      waterFrequencyDays: 4,
      fertilizeFrequencyWeeks: 4,
      pruneSchedule: "Pinch regularly",
      wateringInstructions: "Water when surface dries. Avoid soggy soil and wet leaves.",
      fertilizingInstructions: "Half-strength feed every 4 weeks while blooming.",
      pruningInstructions: "Pinch stems to keep compact; deadhead spent blooms.",
    },
  },
];

export function defaultCareForSpecies(species: string): BaseCareValues {
  const lower = species.toLowerCase();
  for (const rule of CARE_RULES) {
    if (rule.match.test(lower)) return { ...rule.care };
  }
  return {
    waterFrequencyDays: 5,
    fertilizeFrequencyWeeks: 8,
    pruneSchedule: "Early spring",
    wateringInstructions: "Keep soil evenly moist, not soggy.",
    fertilizingInstructions: "Balanced fertilizer every 8 weeks in growing season.",
    pruningInstructions: "Remove dead or damaged growth in early spring.",
  };
}

/** Generic PlantPal artwork — guaranteed local asset, never a broken image. */
export const DEFAULT_PLANT_IMAGE = "/artwork/plantpal-generic.webp";

/**
 * Species-aware Planty one-liners for the care plan card and plant tips.
 *
 * No generic filler. Every fact should be useful or memorable, in the
 * PlantPal voice: short, funny, direct. No em dashes. No AI wording.
 *
 * Rotation: facts are picked by hashing plantId + date, so each plant gets
 * a stable fact for the day and a different one tomorrow.
 */

import { getReferenceFact } from "@/lib/intelligence/plant-reference";

export interface PlantyFactInput {
  species?: string | null;
  commonName?: string | null;
  /** Selected goal ids, e.g. "more-fruit", "more-flowers". */
  goals?: string[];
  /** ZIP or free-form location. Currently a light signal only. */
  location?: string | null;
  season?: "spring" | "summer" | "fall" | "winter";
  /** Care plan text. Used as a light signal for extra facts. */
  carePlan?: string | null;
  /** Stable id for daily rotation. */
  plantId?: string;
}

interface SpeciesFacts {
  /** Lowercase keywords matched against species + common name. */
  match: string[];
  facts: string[];
}

const SPECIES_FACTS: SpeciesFacts[] = [
  {
    match: ["bougainvillea"],
    facts: [
      "Bougainvillea flowers best when it's a little stressed. Too much water can mean fewer blooms.",
      "Those bright colors are bracts, not flowers. Plant drama comes with technicalities.",
      "Prune after a bloom cycle if you want more branching and more color.",
      "Bougainvillea blooms on new growth. A light trim is an invitation.",
    ],
  },
  {
    match: ["meyer lemon", "lemon", "citrus", "orange", "lime", "grapefruit", "mandarin", "kumquat"],
    facts: [
      "In warm climates, Meyer lemons can produce fruit more than once a year.",
      "Deep watering beats tiny sips. Citrus roots like commitment.",
      "Too much nitrogen can grow leaves instead of fruit. Feed for the goal.",
      "Citrus drops fruit it can't support. That's budgeting, not failure.",
      "Yellow leaves on citrus often mean hungry, not thirsty. Check feeding first.",
    ],
  },
  {
    match: ["japanese maple", "acer palmatum"],
    facts: [
      "Morning sun and afternoon shade keep Japanese maple leaves happier.",
      "Japanese maples are slow growers. This is a patience plant.",
      "Crispy leaf edges usually mean hot afternoon sun or wind, not disease.",
      "Prune Japanese maples in late winter. Summer cuts bleed sap and sulk.",
    ],
  },
  {
    match: ["tomato"],
    facts: [
      "Tomatoes hate wet leaves. Water the soil, not the drama.",
      "Good airflow can save you from fungus problems later.",
      "Pinch the suckers between stem and branch for bigger fruit.",
      "Inconsistent watering causes cracked tomatoes. Keep a schedule.",
      "Tomatoes are heavy feeders. They will eat you out of compost and ask for more.",
    ],
  },
  {
    match: ["monstera"],
    facts: [
      "Monstera leaves split for light. No splits usually means not enough of it.",
      "Monsteras climb in the wild. Give it a pole and watch it show off.",
      "Wipe the big leaves now and then. Dust blocks the light they eat.",
    ],
  },
  {
    match: ["pothos", "epipremnum"],
    facts: [
      "Pothos survives neglect, but it grows for attention. Brighter light, fuller vines.",
      "If pothos leaves lose their pattern, the plant wants more light.",
      "Pothos cuttings root in plain water. Free plants are the best plants.",
    ],
  },
  {
    match: ["snake plant", "sansevieria", "dracaena trifasciata"],
    facts: [
      "Snake plants die from love more often than neglect. Water less than you think.",
      "Snake plants would rather be root bound than repotted early.",
      "If a snake plant leaf goes mushy at the base, that's overwatering talking.",
    ],
  },
  {
    match: ["succulent", "cactus", "echeveria", "aloe", "jade", "crassula"],
    facts: [
      "Succulents store water for a living. Your job is mostly to not help too much.",
      "Stretched-out succulents are reaching for light, not growing well.",
      "Water succulents deeply, then forget about them for a while. They prefer it.",
    ],
  },
  {
    match: ["fiddle leaf", "ficus lyrata"],
    facts: [
      "Fiddle leaf figs hate moving. Pick a spot and commit.",
      "Brown spots in the middle of fiddle leaves usually mean overwatering.",
      "Rotate your fiddle a quarter turn each week or it will lean like a tower in Pisa.",
    ],
  },
  {
    match: ["basil"],
    facts: [
      "Pinch basil from the top and it grows bushy. Pick from the bottom and it gives up.",
      "Basil flowers taste like a farewell letter. Pinch the buds to keep leaves coming.",
      "Basil wilts dramatically when thirsty, then bounces back fast. Drama queen behavior.",
    ],
  },
  {
    match: ["lavender"],
    facts: [
      "Lavender wants poor soil and tough love. Rich soil makes it floppy.",
      "Overwatered lavender dies politely and slowly. Keep it on the dry side.",
      "Prune lavender after flowering, but never cut into the old wood.",
    ],
  },
  {
    match: ["rose"],
    facts: [
      "Roses bloom on new growth. Deadheading is not optional if you want a show.",
      "Water roses at the base. Wet leaves invite black spot to the party.",
      "A hard spring prune scares people and delights roses.",
    ],
  },
  {
    match: ["hydrangea"],
    facts: [
      "Some hydrangeas change flower color with soil pH. Acid soil leans blue, alkaline leans pink.",
      "Hydrangeas wilt in afternoon heat even when watered. Check the soil before panicking.",
      "Prune the wrong hydrangea at the wrong time and you cut off next year's flowers. Know your type.",
    ],
  },
  {
    match: ["orchid", "phalaenopsis"],
    facts: [
      "Orchid roots photosynthesize. That's why they live in clear pots.",
      "Ice cube watering is a myth orchids tolerate, not enjoy. Soak and drain instead.",
      "An orchid dropping flowers is resting, not dying. The leaves tell the real story.",
    ],
  },
  {
    match: ["fern", "boston fern", "maidenhair"],
    facts: [
      "Ferns are humidity creatures. Crispy tips mean the air is too dry, not the soil.",
      "Ferns like consistently moist soil, not swampy soil. There's a difference.",
    ],
  },
  {
    match: ["pepper", "chili", "capsicum", "jalapeno", "jalapeño"],
    facts: [
      "A little stress makes hotter peppers. Science sides with the drama.",
      "Peppers drop flowers when nights are too cold or too hot. They're picky like that.",
      "Pick the first peppers early. The plant responds with more.",
    ],
  },
  {
    match: ["strawberry"],
    facts: [
      "Pinch the first strawberry runners and the plant puts that energy into fruit.",
      "Strawberries rot where they touch soil. Straw mulch isn't just a cute name.",
    ],
  },
  {
    match: ["rosemary"],
    facts: [
      "Rosemary is from dry Mediterranean hills. Treat it like a succulent with ambition.",
      "Rosemary hates wet feet more than it hates drought.",
    ],
  },
  {
    match: ["mint"],
    facts: [
      "Mint in open soil is an invasion, not a planting. Keep it in a pot.",
      "Mint grows back from almost anything. It is the horror movie villain of herbs.",
    ],
  },
  {
    match: ["hibiscus"],
    facts: [
      "Hibiscus blooms last one day each. The plant just keeps making more.",
      "Hibiscus buds drop when watering is inconsistent. Keep it steady.",
    ],
  },
  {
    match: ["avocado"],
    facts: [
      "Avocado trees from pits can take 10 years to fruit, if ever. Grafted trees skip the wait.",
      "Avocados drink deeply but hate sitting in water. Drainage is everything.",
    ],
  },
  {
    match: ["fig", "ficus carica"],
    facts: [
      "Figs fruit on new wood. Prune in winter and the tree pays you back in summer.",
      "A slightly root-bound fig often fruits better. Stress with a purpose.",
    ],
  },
  {
    match: ["olive"],
    facts: [
      "Olive trees can live for centuries. You're not raising a plant, you're starting a dynasty.",
      "Olives fruit better with a winter chill. Mild stress, big payoff.",
    ],
  },
];

/** Goal-keyed facts. Matched by goal id substring. */
const GOAL_FACTS: { match: string[]; facts: string[] }[] = [
  {
    match: ["more-fruit", "bigger-fruit", "bigger-harvest", "earlier-fruiting"],
    facts: [
      "Fruit takes energy. Feed for fruit, not just leaves.",
      "Consistent deep watering during fruit set beats daily sprinkles.",
      "Thinning crowded fruit early means bigger fruit later. Quality over quantity.",
    ],
  },
  {
    match: ["more-flowers", "bigger-blooms", "longer-bloom-season"],
    facts: [
      "Deadhead spent blooms and the plant keeps trying to impress you.",
      "Phosphorus drives blooms. Too much nitrogen grows leaves instead.",
      "Most bloomers flower harder with more light. Shade is the silent bloom killer.",
    ],
  },
  {
    match: ["faster-growth", "fuller-growth"],
    facts: [
      "Growth follows light. More light, more leaves. It's a simple economy.",
      "Pinching growing tips makes a plant branch out instead of up.",
    ],
  },
  {
    match: ["drought-tolerance"],
    facts: [
      "Deep, infrequent watering trains roots to dig. Shallow sips train them to be lazy.",
      "Mulch is the cheapest drought insurance there is.",
    ],
  },
  {
    match: ["prune-for-growth", "prune-for-shape", "better-shape", "more-branching"],
    facts: [
      "Every cut redirects energy. Prune with a plan, not a mood.",
      "Clean, sharp tools make cuts that heal. Dull tools make wounds.",
    ],
  },
  {
    match: ["keep-it-alive", "low-maintenance", "health-recovery"],
    facts: [
      "Most houseplants die from overwatering. When in doubt, wait a day.",
      "Check the soil with a finger before watering. It's free and it's accurate.",
    ],
  },
];

const SEASON_FACTS: Record<NonNullable<PlantyFactInput["season"]>, string[]> = {
  spring: [
    "Spring is feeding season. Plants wake up hungry.",
    "New spring growth is soft and tasty. Pests know this too. Keep an eye out.",
  ],
  summer: [
    "Summer heat means pots dry out fast. Check them more often than you think.",
    "Water early in the morning in summer. Less evaporation, fewer fungus problems.",
  ],
  fall: [
    "Fall is for roots. Growth slows up top while the underground does the work.",
    "Ease off the fertilizer in fall. Pushing soft new growth before winter backfires.",
  ],
  winter: [
    "Most plants rest in winter. Less water, less food, more patience.",
    "Winter overwatering is the number one indoor plant killer. Soil dries slower in the cold.",
  ],
};

export const PLANTY_FACT_FALLBACK =
  "Your plant is trying to tell you something. We're taking notes.";

function currentSeason(date = new Date()): NonNullable<PlantyFactInput["season"]> {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Pick a fact for this plant. Species facts win, then goal facts, then
 * season facts. Rotates daily per plant so it never feels copy-pasted.
 */
export function getPlantyFact(input: PlantyFactInput): string {
  const name = `${input.species ?? ""} ${input.commonName ?? ""}`.toLowerCase();
  const pool: string[] = [];

  for (const entry of SPECIES_FACTS) {
    if (entry.match.some((kw) => name.includes(kw))) {
      pool.push(...entry.facts);
      break;
    }
  }

  const goals = input.goals ?? [];
  for (const entry of GOAL_FACTS) {
    if (goals.some((g) => entry.match.includes(g))) {
      pool.push(...entry.facts);
    }
  }

  // Reference-backed fact from the USDA-style dataset, when we have one.
  const referenceFact = getReferenceFact(input.species ?? input.commonName);
  if (referenceFact) {
    pool.push(referenceFact.fact);
  }

  // Care plan as a light signal: pruning advice gets a pruning fact.
  if (pool.length === 0 && input.carePlan && /prun/i.test(input.carePlan)) {
    pool.push("Every cut redirects energy. Prune with a plan, not a mood.");
  }

  const season = input.season ?? currentSeason();
  pool.push(...SEASON_FACTS[season]);

  if (pool.length === 0) return PLANTY_FACT_FALLBACK;

  const dateKey = new Date().toISOString().slice(0, 10);
  const index = hashString(`${input.plantId ?? name}|${dateKey}`) % pool.length;
  return pool[index];
}

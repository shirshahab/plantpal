/**
 * Prune for Growth: species-aware pruning guidance.
 *
 * Explains when to prune, what to cut, what not to cut, how much to
 * remove, which season matters, how pruning drives new growth, and
 * plant-specific warnings. Rendered as a dedicated card in the plant
 * detail care plan.
 */

export interface PruneForGrowthGuide {
  /** Friendly title, e.g. "Pruning your Bougainvillea". */
  title: string;
  /** When to prune. */
  when: string;
  /** What to cut. */
  whatToCut: string[];
  /** What not to cut. */
  whatNotToCut: string[];
  /** How much to remove in one session. */
  howMuch: string;
  /** Why season matters for this plant. */
  season: string;
  /** How pruning affects new growth. */
  growthEffect: string;
  /** Plant-specific warnings. */
  warnings: string[];
}

interface PruneRule {
  match: RegExp;
  guide: Omit<PruneForGrowthGuide, "title">;
}

const RULES: PruneRule[] = [
  {
    match: /bougainvillea/i,
    guide: {
      when: "Right after a bloom cycle ends. Bougainvillea flowers on new growth, so each trim sets up the next flush.",
      whatToCut: [
        "Leggy shoots that outgrew the shape",
        "Spent bloom clusters",
        "Crossing or inward-growing branches",
      ],
      whatNotToCut: [
        "Healthy new shoots with fresh bracts forming",
        "Main structural branches",
      ],
      howMuch: "Light trims only. Take the leggy growth back by a third to encourage branching.",
      season: "Prune after blooming in warm months. Skip pruning during cold snaps.",
      growthEffect: "Cutting leggy growth forces branching, and more branches mean more bloom sites. These plants also flower better when kept slightly dry.",
      warnings: [
        "Do not hard prune during cold stress. Wait for warm weather.",
        "Wear gloves. The thorns are not kidding.",
      ],
    },
  },
  {
    match: /meyer lemon|lemon|lime|orange|citrus|grapefruit|kumquat|mandarin/i,
    guide: {
      when: "Late winter to early spring, before the main growth push.",
      whatToCut: [
        "Dead or damaged wood",
        "Branches growing inward or crossing",
        "Suckers sprouting below the graft line",
        "Water sprouts shooting straight up",
      ],
      whatNotToCut: [
        "Branches holding flowers or fruit",
        "The main scaffold branches",
      ],
      howMuch: "Less than 20% of the canopy in one season. Citrus does not need heavy pruning.",
      season: "Avoid pruning during flowering or fruiting. You will be cutting off your harvest.",
      growthEffect: "Opening the canopy lets light reach inner branches, which improves fruit set and air flow.",
      warnings: [
        "Avoid heavy pruning while the tree is flowering or holding fruit.",
        "Always remove growth from below the graft. It steals energy from the good wood.",
      ],
    },
  },
  {
    match: /tomato/i,
    guide: {
      when: "Throughout the growing season, a little at a time.",
      whatToCut: [
        "Lower leaves touching the soil",
        "Suckers in the branch joints (for indeterminate varieties)",
        "Yellowing or diseased leaves",
      ],
      whatNotToCut: [
        "The growing tip, unless you are topping at season end",
        "Leaves directly shading ripening fruit in extreme heat",
        "Suckers on determinate varieties. They need them for yield",
      ],
      howMuch: "A few leaves and suckers per session. Never strip the plant.",
      season: "Prune on dry mornings so cuts heal fast and disease cannot move in.",
      growthEffect: "Removing suckers pushes energy into fruit instead of foliage. Keeping airflow strong prevents blight.",
      warnings: [
        "Know your variety first. Determinate tomatoes should keep their suckers.",
        "Wet-weather pruning spreads disease between plants.",
      ],
    },
  },
  {
    match: /rose/i,
    guide: {
      when: "Late winter or early spring, when buds start to swell.",
      whatToCut: [
        "Dead, damaged, or crossing canes",
        "Thin, weak growth smaller than a pencil",
        "Spent blooms through the season (deadheading)",
      ],
      whatNotToCut: [
        "Strong, healthy outward-facing canes",
        "New basal shoots. They are next year's framework",
      ],
      howMuch: "Up to a third for shape. Hard rejuvenation cuts only on overgrown, established plants.",
      season: "Spring pruning sets the structure. Deadheading all season keeps blooms coming.",
      growthEffect: "Cutting above an outward-facing bud directs new growth out, opening the center for light and air.",
      warnings: ["Cut at a 45 degree angle above an outward-facing bud."],
    },
  },
  {
    match: /hibiscus|azalea|hydrangea|camellia|gardenia|lilac/i,
    guide: {
      when: "Right after the bloom cycle finishes.",
      whatToCut: [
        "Spent flower heads",
        "Leggy stems that ruin the shape",
        "Dead or crossing branches",
      ],
      whatNotToCut: [
        "Stems with next season's buds already forming",
        "More than a third of the plant",
      ],
      howMuch: "Light shaping cuts. These shrubs bloom on a schedule, so over-pruning costs you flowers.",
      season: "Timing is everything. Pruning too late removes next year's flower buds.",
      growthEffect: "Post-bloom pruning triggers branching, and more branches mean more flowers next cycle.",
      warnings: [
        "Some hydrangeas bloom on old wood. Confirm your variety before cutting hard.",
      ],
    },
  },
  {
    match: /bonsai|juniper|ficus retusa/i,
    guide: {
      when: "Structural pruning in early spring. Maintenance pinching through the growing season.",
      whatToCut: [
        "Shoots that extend past the silhouette",
        "Downward and inward growth",
        "One of any pair of crossing branches",
      ],
      whatNotToCut: [
        "More than a third of the foliage at once",
        "All new growth. The tree needs some to feed itself",
      ],
      howMuch: "Small, frequent cuts beat one big haircut. Let the tree recover between sessions.",
      season: "Spring cuts heal fastest. Avoid heavy work in midsummer heat or winter dormancy.",
      growthEffect: "Pruning the tips triggers back-budding closer to the trunk, which builds density and ramification.",
      warnings: [
        "Root pruning and heavy top pruning should not happen in the same season.",
        "Check wiring after every prune. Wire bites in fast on new growth.",
      ],
    },
  },
  {
    match: /hedge|privet|boxwood|laurel|arborvitae|photinia|privacy/i,
    guide: {
      when: "Late spring after the first growth flush, then touch-ups through summer.",
      whatToCut: [
        "New growth extending past the hedge line",
        "Dead patches and crossing interior branches",
      ],
      whatNotToCut: [
        "Into bare old wood. Many hedges will not regrow from it",
        "The leader, until the hedge reaches target height",
      ],
      howMuch: "Trim the newest growth back by half. Keep the base wider than the top so light reaches bottom leaves.",
      season: "Stop shearing by late summer so new growth hardens before cold weather.",
      growthEffect: "Frequent light shearing forces dense branching, which is exactly what a privacy screen needs.",
      warnings: [
        "A hedge sheared narrower at the bottom goes bald at the base. Keep it wider below.",
      ],
    },
  },
  {
    match: /pothos|monstera|philodendron|snake plant|ficus|rubber|dracaena|indoor/i,
    guide: {
      when: "Spring and summer, when the plant is actively growing.",
      whatToCut: [
        "Leggy vines or stems just above a node",
        "Yellow or damaged leaves at the base",
      ],
      whatNotToCut: [
        "More than a quarter of the foliage at once",
        "Aerial roots on climbing plants. They help it feed",
      ],
      howMuch: "A few stems per session. Cuttings often root in water, so nothing goes to waste.",
      season: "Avoid pruning in winter when growth is slow and recovery takes longer.",
      growthEffect: "Cutting above a node wakes up the buds below it, so one stem becomes two.",
      warnings: ["Some houseplants have irritating sap. Wash your hands after cutting."],
    },
  },
];

/**
 * Compliance-safe guidance for flowering crops grown in controlled
 * environments. Language stays general on purpose.
 */
const HIGH_VALUE_CROP_GUIDE: Omit<PruneForGrowthGuide, "title"> = {
  when: "During the vegetative stage, before flowering begins.",
  whatToCut: [
    "Lower growth that gets no light",
    "Inward-facing shoots crowding the canopy",
    "Dead or yellowing leaves",
  ],
  whatNotToCut: [
    "Healthy upper growth during flowering",
    "More than 20% of the canopy in one session",
  ],
  howMuch: "Light, frequent maintenance. Controlled environment crops respond best to small adjustments.",
  season: "All structural pruning happens in the vegetative stage. Flowering plants should be left alone.",
  growthEffect: "Opening the canopy pushes energy to the productive tops and keeps airflow strong, which matters for high-value crops.",
  warnings: [
    "Stress during flowering reduces yield. Make big cuts early or not at all.",
    "Sanitize tools between plants. Controlled environments spread problems fast.",
  ],
};

const DEFAULT_GUIDE: Omit<PruneForGrowthGuide, "title"> = {
  when: "Late winter or early spring for most plants, before new growth starts.",
  whatToCut: [
    "Dead, damaged, or diseased wood (any time of year)",
    "Crossing or rubbing branches",
    "Leggy growth that ruins the shape",
  ],
  whatNotToCut: [
    "More than a third of the plant in one session",
    "Branches with flower buds, unless you are okay losing those blooms",
  ],
  howMuch: "Start with less than you think. You can always cut more next time.",
  season: "Dormant-season cuts trigger a strong spring response. Summer cuts slow growth down.",
  growthEffect: "Every cut redirects energy to the buds below it. Prune above an outward-facing bud to steer growth where you want it.",
  warnings: ["Sharp, clean tools make clean cuts that heal fast."],
};

/** Match species/name text to a pruning guide. */
export function getPruneForGrowthGuide(
  species: string,
  name = ""
): PruneForGrowthGuide {
  const text = `${species} ${name}`.trim();
  const label = name.trim() || species.trim() || "your plant";

  if (/controlled environment|high-value|flowering crop/i.test(text)) {
    return { title: `Pruning ${label}`, ...HIGH_VALUE_CROP_GUIDE };
  }

  for (const rule of RULES) {
    if (rule.match.test(text)) {
      return { title: `Pruning ${label}`, ...rule.guide };
    }
  }
  return { title: `Pruning ${label}`, ...DEFAULT_GUIDE };
}

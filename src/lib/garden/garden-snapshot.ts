import type { Plant } from "@/lib/types";
import type { AcademyRank } from "@/lib/academy/types";
import { getRankForXp, RANK_EMOJI } from "@/lib/academy/ranks";

export type GardenChipType = "plants" | "category" | "streak" | "rank" | "xp";

export interface GardenChip {
  label: string;
  emoji: string;
  count?: number;
  type: GardenChipType;
}

export type PlantGardenCategory =
  | "Citrus"
  | "Succulents"
  | "Herbs"
  | "Houseplants"
  | "Trees"
  | "Vegetables"
  | "Flowers"
  | "Bonsai"
  | "Unknown";

const CATEGORY_RULES: { category: PlantGardenCategory; emoji: string; match: RegExp }[] = [
  { category: "Citrus", emoji: "🍋", match: /citrus|lemon|lime|orange|grapefruit|kumquat|mandarin/i },
  { category: "Succulents", emoji: "🌵", match: /succulent|cactus|aloe|agave|echeveria|sedum|jade|haworthia/i },
  { category: "Herbs", emoji: "🌿", match: /basil|mint|rosemary|thyme|oregano|sage|parsley|cilantro|herb|lavender/i },
  { category: "Bonsai", emoji: "🎍", match: /bonsai/i },
  { category: "Trees", emoji: "🌳", match: /tree|maple|oak|pine|avocado|fig|ficus|palm|birch|cedar|elm/i },
  { category: "Vegetables", emoji: "🍅", match: /tomato|pepper|squash|cucumber|lettuce|kale|vegetable|eggplant|bean|pea|carrot/i },
  { category: "Flowers", emoji: "🌸", match: /rose|flower|begonia|orchid|hibiscus|bougainvillea|petunia|marigold|daisy|lily/i },
  {
    category: "Houseplants",
    emoji: "🪴",
    match: /monstera|pothos|philodendron|snake|sansevieria|zz plant|fiddle|calathea|peace lily|spider plant|indoor/i,
  },
];

export function inferPlantCategory(plant: Plant): PlantGardenCategory {
  const hay = `${plant.name} ${plant.species}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(hay)) return rule.category;
  }
  return "Unknown";
}

export function categoryEmoji(category: PlantGardenCategory): string {
  return CATEGORY_RULES.find((r) => r.category === category)?.emoji ?? "🪴";
}

export interface GardenSnapshotInput {
  plants: Plant[];
  streakDays?: number;
  totalXp?: number;
}

export interface GardenSnapshot {
  summaryText: string;
  chips: GardenChip[];
}

export function buildGardenSnapshot(input: GardenSnapshotInput): GardenSnapshot {
  const { plants, streakDays = 0, totalXp = 0 } = input;
  const count = plants.length;
  const rank: AcademyRank = getRankForXp(totalXp);
  const rankEmoji = RANK_EMOJI[rank];

  if (count === 0) {
    return {
      summaryText: "No plants under supervision yet.",
      chips: [],
    };
  }

  const categoryCounts = new Map<PlantGardenCategory, number>();
  for (const plant of plants) {
    const cat = inferPlantCategory(plant);
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }

  const knownCategories = [...categoryCounts.entries()]
    .filter(([cat]) => cat !== "Unknown")
    .sort((a, b) => b[1] - a[1]);

  const chips: GardenChip[] = [];

  if (count === 1) {
    const cat = inferPlantCategory(plants[0]!);
    chips.push({
      label: cat === "Unknown" ? "1 plant" : cat,
      emoji: categoryEmoji(cat),
      count: 1,
      type: "category",
    });
  } else if (knownCategories.length >= 2) {
    for (const [cat, n] of knownCategories.slice(0, 3)) {
      chips.push({
        label: cat,
        emoji: categoryEmoji(cat),
        count: n,
        type: "category",
      });
    }
  } else {
    chips.push({
      label: count === 1 ? "plant" : "plants",
      emoji: "🪴",
      count,
      type: "plants",
    });
  }

  if (streakDays >= 1) {
    chips.push({
      label: `${streakDays}d streak`,
      emoji: "🔥",
      count: streakDays,
      type: "streak",
    });
  }

  chips.push({
    label: rank,
    emoji: rankEmoji,
    type: "rank",
  });

  if (totalXp > 0) {
    chips.push({
      label: `${totalXp} XP`,
      emoji: "⭐",
      count: totalXp,
      type: "xp",
    });
  }

  let summaryText: string;
  if (count === 1) {
    summaryText = "1 plant. 1 ongoing investigation.";
  } else if (knownCategories.length >= 2) {
    summaryText = knownCategories
      .slice(0, 3)
      .map(([cat, n]) => `${categoryEmoji(cat)} ${cat} ${n}`)
      .join(" · ");
  } else {
    summaryText = `${count} plants under Planty supervision`;
  }

  return { summaryText, chips };
}

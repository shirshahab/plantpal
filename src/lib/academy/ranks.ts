import type { AcademyRank, RankInfo } from "./types";

export const RANK_THRESHOLDS: { rank: AcademyRank; minXp: number }[] = [
  { rank: "Plant Wizard", minXp: 5000 },
  { rank: "Botanical Expert", minXp: 3000 },
  { rank: "Master Grower", minXp: 1800 },
  { rank: "Green Thumb", minXp: 900 },
  { rank: "Gardener", minXp: 400 },
  { rank: "Sprout", minXp: 100 },
  { rank: "Seedling", minXp: 0 },
];

export function getRankForXp(totalXp: number): AcademyRank {
  for (const entry of RANK_THRESHOLDS) {
    if (totalXp >= entry.minXp) return entry.rank;
  }
  return "Seedling";
}

export function getRankInfo(totalXp: number): RankInfo {
  const rank = getRankForXp(totalXp);
  const idx = RANK_THRESHOLDS.findIndex((r) => r.rank === rank);
  const currentMin = RANK_THRESHOLDS[idx]?.minXp ?? 0;
  const nextMin = RANK_THRESHOLDS[idx - 1]?.minXp ?? currentMin + 1000;
  const xpInRank = totalXp - currentMin;
  const xpToNextRank = Math.max(0, nextMin - totalXp);
  const span = nextMin - currentMin;
  const progressPercent =
    idx === 0 ? 100 : Math.min(100, Math.round((xpInRank / span) * 100));

  return {
    rank,
    level: Math.floor(totalXp / 100) + 1,
    xpInRank,
    xpToNextRank,
    progressPercent,
  };
}

export const RANK_EMOJI: Record<AcademyRank, string> = {
  Seedling: "🌱",
  Sprout: "🌿",
  Gardener: "🧑‍🌾",
  "Green Thumb": "👍",
  "Master Grower": "🏆",
  "Botanical Expert": "🎓",
  "Plant Wizard": "🧙",
};

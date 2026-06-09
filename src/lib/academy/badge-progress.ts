import type { AcademyBadge, AcademyProgress } from "./types";
import { ACADEMY_PATHS, getPathProgress } from "./paths";
import { getRankForXp } from "./ranks";

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export const BADGE_RARITY: Record<string, BadgeRarity> = {
  "first-lesson": "common",
  "first-plant": "common",
  "first-diagnosis": "common",
  "streak-7": "rare",
  "lessons-25": "rare",
  "water-master": "rare",
  "compost-hero": "rare",
  "bug-hunter": "rare",
  "plant-doctor": "rare",
  "bonsai-beginner": "rare",
  "fruit-tree-owner": "rare",
  "streak-30": "epic",
  "master-gardener": "epic",
  "botanical-expert": "epic",
  "streak-100": "legendary",
  "plant-wizard": "legendary",
  "family-champion": "legendary",
};

export function getBadgeRarity(badgeId: string): BadgeRarity {
  return BADGE_RARITY[badgeId] ?? "common";
}

export function getUnlockHint(badge: AcademyBadge): string {
  if (badge.unlockKey.startsWith("streak:")) {
    return `Maintain a ${badge.target ?? badge.unlockKey.split(":")[1]}-day learning streak.`;
  }
  if (badge.unlockKey.startsWith("lessons:")) {
    return `Complete ${badge.target} Academy lessons.`;
  }
  if (badge.unlockKey.startsWith("path:")) {
    const pathId = badge.unlockKey.replace("path:", "");
    const path = ACADEMY_PATHS.find((p) => p.id === pathId);
    return path ? `Finish all lessons in ${path.title}.` : badge.description;
  }
  if (badge.unlockKey.startsWith("rank:")) {
    return `Reach ${badge.unlockKey.replace("rank:", "")} rank.`;
  }
  if (badge.unlockKey === "plants:1") return "Add your first plant to My Garden.";
  if (badge.unlockKey === "scans:1") return "Run a plant health scan.";
  if (badge.unlockKey === "fruit_tree") return "Add a fruit tree to your garden.";
  if (badge.unlockKey === "certificates:5") return "Earn 5 path certificates.";
  return badge.description;
}

export function getBadgeProgress(
  badge: AcademyBadge,
  progress: AcademyProgress,
  plantCount: number,
  scanCount: number
): { current: number; target: number; percent: number } {
  const target = badge.target ?? 1;
  let current = 0;

  if (badge.unlockKey.startsWith("streak:")) current = progress.currentStreak;
  else if (badge.unlockKey.startsWith("lessons:")) current = progress.completedLessons.length;
  else if (badge.unlockKey.startsWith("path:")) {
    const pathId = badge.unlockKey.replace("path:", "");
    const p = getPathProgress(pathId, progress.completedLessons);
    current = p.completed;
    return { current, target: p.total, percent: p.percent };
  } else if (badge.unlockKey.startsWith("rank:")) {
    const rank = getRankForXp(progress.totalXp);
    const want = badge.unlockKey.replace("rank:", "");
    current = rank === want || progress.totalXp >= 5000 ? 1 : 0;
  } else if (badge.unlockKey === "plants:1") current = plantCount;
  else if (badge.unlockKey === "scans:1") current = scanCount;
  else if (badge.unlockKey === "certificates:5") current = progress.earnedCertificates.length;
  else if (progress.unlockedBadges.includes(badge.id)) current = target;

  const percent = Math.min(100, Math.round((current / target) * 100));
  return { current, target, percent };
}

export const RARITY_STYLES: Record<BadgeRarity, string> = {
  common: "border-gray-200 bg-gray-50",
  rare: "border-blue-200 bg-blue-50/60",
  epic: "border-purple-200 bg-purple-50/60",
  legendary: "border-amber-300 bg-amber-50/80",
};

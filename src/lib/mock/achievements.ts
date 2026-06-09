import type { Achievement } from "@/lib/types/phase6";

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlockedAt">[] = [
  { id: "first-plant", title: "First Plant Added", description: "Welcome to PlantPal!", icon: "🌱", category: "milestone", target: 1 },
  { id: "first-tree", title: "First Tree Added", description: "Added your first tree.", icon: "🌳", category: "collection", target: 1 },
  { id: "first-scan", title: "First Health Scan", description: "Diagnosed a plant with the scanner.", icon: "🔍", category: "care", target: 1 },
  { id: "water-streak-7", title: "7-Day Watering Streak", description: "Logged watering 7 days in a row.", icon: "💧", category: "care", target: 7 },
  { id: "plant-parent-30", title: "30-Day Plant Parent", description: "Caring for plants for 30 days.", icon: "🏆", category: "milestone", target: 30 },
  { id: "first-growth-photo", title: "First Growth Photo", description: "Documented plant progress.", icon: "📸", category: "care", target: 1 },
  { id: "pest-hunter", title: "Pest Hunter", description: "Identified a pest issue.", icon: "🐛", category: "care", target: 1 },
  { id: "citrus-expert", title: "Citrus Expert", description: "Added a citrus plant.", icon: "🍋", category: "collection", target: 1 },
  { id: "bonsai-beginner", title: "Bonsai Beginner", description: "Started a bonsai collection.", icon: "🪴", category: "collection", target: 1 },
  { id: "garden-80", title: "Garden Score 80+", description: "Garden score reached 80.", icon: "⭐", category: "milestone", target: 80 },
  { id: "garden-90", title: "Garden Score 90+", description: "Garden score reached 90.", icon: "🌟", category: "milestone", target: 90 },
  { id: "plants-10", title: "10 Plants Added", description: "Built a serious garden.", icon: "🌿", category: "milestone", target: 10 },
  { id: "plants-25", title: "25 Plants Added", description: "Plant collector status.", icon: "🌺", category: "milestone", target: 25 },
];

export function buildAchievements(unlocked: Record<string, string>): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    unlockedAt: unlocked[def.id] ?? null,
  }));
}

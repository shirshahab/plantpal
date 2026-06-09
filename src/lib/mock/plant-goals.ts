import type { GoalCategory, PlantGoal } from "@/lib/types/care-goals";

function goal(
  id: string,
  name: string,
  category: GoalCategory,
  description: string,
  icon: string
): PlantGoal {
  return { id, name, category, description, icon };
}

/** Catalog of all selectable plant goals — mirrors supabase plant_goals seed. */
export const PLANT_GOAL_CATALOG: PlantGoal[] = [
  // General
  goal("keep-it-alive", "Keep it alive", "general", "Build a simple routine that keeps your plant healthy.", "🌱"),
  goal("low-maintenance", "Low maintenance", "general", "Spend less time while still getting good results.", "☕"),
  goal("faster-growth", "Faster growth", "general", "Encourage vigorous new leaves and branches.", "🚀"),
  goal("health-recovery", "Health recovery", "general", "Bring a stressed plant back to strength.", "💚"),
  goal("repot-later", "Repot later", "general", "Plan the right time and method for repotting.", "🪴"),
  goal("organic-care", "Organic care", "general", "Use natural fertilizers and gentle pest control.", "🍃"),

  // Fruit trees
  goal("more-fruit", "More fruit", "fruit_trees", "Maximize flower set and fruit production.", "🍊"),
  goal("bigger-fruit", "Bigger fruit", "fruit_trees", "Support larger, juicier harvests.", "🍑"),
  goal("earlier-fruiting", "Earlier fruiting", "fruit_trees", "Encourage fruit sooner in the season.", "⏰"),
  goal("stronger-roots", "Stronger roots", "fruit_trees", "Build a deep root system for long-term health.", "🌳"),

  // Flowering
  goal("more-flowers", "More flowers", "flowering", "Increase bloom count throughout the season.", "🌸"),
  goal("bigger-blooms", "Bigger blooms", "flowering", "Help flowers open larger and brighter.", "🌺"),
  goal("longer-bloom-season", "Longer bloom season", "flowering", "Extend how long your plant flowers.", "📅"),
  goal("pollinator-attraction", "Pollinator attraction", "flowering", "Draw bees, butterflies, and hummingbirds.", "🐝"),

  // Landscape
  goal("more-shade", "More shade", "landscape", "Develop a fuller canopy for cooling shade.", "🌤️"),
  goal("privacy-screen", "Privacy screen", "landscape", "Grow a dense, living screen.", "🧱"),
  goal("stronger-structure", "Stronger structure", "landscape", "Build sturdy branches and trunk.", "💪"),
  goal("drought-tolerance", "Drought tolerance", "landscape", "Reduce water needs over time.", "💧"),
  goal("wind-resistance", "Wind resistance", "landscape", "Strengthen against wind and storms.", "🌬️"),

  // Bonsai
  goal("bonsai-training", "Bonsai training", "bonsai", "Shape and refine your tree over seasons.", "✂️"),
  goal("trunk-thickening", "Trunk thickening", "bonsai", "Develop a powerful, tapered trunk.", "🪵"),
  goal("smaller-leaves", "Smaller leaves", "bonsai", "Encourage finer, proportionate foliage.", "🍂"),
  goal("more-branching", "More branching", "bonsai", "Create ramification and pad density.", "🌿"),
  goal("styling-development", "Styling development", "bonsai", "Progress toward your design vision.", "🎨"),
  goal("show-preparation", "Show preparation", "bonsai", "Get show-ready before an exhibition.", "🏆"),

  // Indoor
  goal("fuller-growth", "Fuller growth", "indoor", "Encourage a bushy, balanced shape.", "🪴"),
  goal("better-leaf-color", "Better leaf color", "indoor", "Improve leaf color and vibrancy.", "🎨"),
  goal("reduce-leaf-drop", "Reduce leaf drop", "indoor", "Keep leaves on longer with stable care.", "📉"),
  goal("pest-prevention", "Pest prevention", "indoor", "Stay ahead of common indoor pests.", "🛡️"),
];

export function getGoalById(id: string): PlantGoal | undefined {
  return PLANT_GOAL_CATALOG.find((g) => g.id === id);
}

export function getGoalsByIds(ids: string[]): PlantGoal[] {
  return ids.map(getGoalById).filter((g): g is PlantGoal => !!g);
}

export function getGoalsByCategory(category: GoalCategory): PlantGoal[] {
  return PLANT_GOAL_CATALOG.filter((g) => g.category === category);
}

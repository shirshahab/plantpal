import type { AcademyPath } from "./types";

export const ACADEMY_PATHS: AcademyPath[] = [
  {
    id: "beginner-gardening",
    title: "Beginner Gardening",
    description: "Start here: the essentials every plant parent needs.",
    icon: "🌱",
    color: "#2D6A4F",
    kidSafe: true,
    certificateId: "cert-beginner-gardening",
    lessonIds: [
      "what-plants-need",
      "sun-exposure",
      "watering-basics",
      "new-growth",
      "beginner-common-mistakes",
      "buy-healthy-nursery-plant",
      "usda-zones",
    ],
  },
  {
    id: "soil-mastery",
    title: "Soil Mastery",
    description: "Great gardens start underground.",
    icon: "🪨",
    color: "#6B5B3E",
    kidSafe: true,
    certificateId: "cert-soil-mastery",
    lessonIds: [
      "soil-types",
      "soil-ph",
      "soil-drainage",
      "organic-matter",
      "compost-basics",
      "mulch-basics",
      "raised-beds",
      "local-soil",
    ],
  },
  {
    id: "water-mastery",
    title: "Water Mastery",
    description: "Water smarter, not more.",
    icon: "💧",
    color: "#2563EB",
    kidSafe: true,
    certificateId: "cert-water-mastery",
    lessonIds: [
      "water-deeply",
      "overwatering-signs",
      "underwatering-signs",
      "irrigation-basics",
      "rain-collection",
      "water-hot-dry-summers",
    ],
  },
  {
    id: "fertilizer-mastery",
    title: "Fertilizer Mastery",
    description: "Feed plants at the right time, the right way.",
    icon: "🧪",
    color: "#7C3AED",
    kidSafe: true,
    certificateId: "cert-fertilizer-mastery",
    lessonIds: [
      "npk-basics",
      "organic-fertilizers",
      "synthetic-fertilizers",
      "when-to-fertilize",
      "fertilize-citrus",
      "micronutrients",
    ],
  },
  {
    id: "plant-health",
    title: "Plant Health",
    description: "Diagnose problems before they spread.",
    icon: "🩺",
    color: "#DC2626",
    kidSafe: true,
    certificateId: "cert-plant-health",
    lessonIds: [
      "yellow-leaves",
      "brown-leaves",
      "root-rot",
      "nutrient-deficiencies",
      "heat-wave-stress",
      "frost-protection",
      "transplant-shock",
    ],
  },
  {
    id: "garden-bugs",
    title: "Garden Bugs",
    description: "Know your allies and enemies.",
    icon: "🐛",
    color: "#CA8A04",
    kidSafe: true,
    certificateId: "cert-garden-bugs",
    lessonIds: [
      "beneficial-insects",
      "ladybugs",
      "bees-pollinators",
      "butterflies",
      "aphids",
      "spider-mites",
      "scale-insects",
      "whiteflies",
      "mealybugs",
    ],
  },
  {
    id: "fruit-trees",
    title: "Fruit Trees",
    description: "Grow your own backyard harvest.",
    icon: "🍊",
    color: "#EA580C",
    kidSafe: true,
    certificateId: "cert-fruit-trees",
    lessonIds: [
      "citrus-trees",
      "avocado-trees",
      "apple-trees",
      "peach-trees",
      "fig-trees",
      "olive-trees",
      "pomegranate-trees",
    ],
  },
  {
    id: "bonsai",
    title: "Bonsai",
    description: "The art of miniature trees.",
    icon: "🌳",
    color: "#059669",
    kidSafe: true,
    certificateId: "cert-bonsai",
    lessonIds: [
      "prune-safely",
      "bonsai-wiring",
      "bonsai-root-pruning",
      "bonsai-repotting",
      "bonsai-species",
    ],
  },
  {
    id: "vegetable-gardening",
    title: "Vegetable Gardening",
    description: "From seed to supper.",
    icon: "🍅",
    color: "#16A34A",
    kidSafe: true,
    certificateId: "cert-vegetable-gardening",
    lessonIds: [
      "tomato-growing",
      "pepper-growing",
      "herb-garden",
      "lettuce-growing",
      "squash-growing",
      "companion-planting",
    ],
  },
  {
    id: "landscaping",
    title: "Landscaping",
    description: "Design outdoor spaces you love.",
    icon: "🏡",
    color: "#0D9488",
    kidSafe: true,
    certificateId: "cert-landscaping",
    lessonIds: [
      "design-principles",
      "privacy-trees",
      "ground-cover",
      "water-features",
      "landscape-lighting",
      "hardscaping-basics",
    ],
  },
];

export function getPathById(id: string): AcademyPath | undefined {
  return ACADEMY_PATHS.find((p) => p.id === id);
}

export function getAllPathLessonIds(): string[] {
  return [...new Set(ACADEMY_PATHS.flatMap((p) => p.lessonIds))];
}

export function getPathForLesson(lessonId: string): AcademyPath | undefined {
  return ACADEMY_PATHS.find((p) => p.lessonIds.includes(lessonId));
}

export function getPathProgress(
  pathId: string,
  completedLessons: string[]
): { completed: number; total: number; percent: number } {
  const path = getPathById(pathId);
  if (!path) return { completed: 0, total: 0, percent: 0 };
  const completed = path.lessonIds.filter((id) => completedLessons.includes(id)).length;
  return {
    completed,
    total: path.lessonIds.length,
    percent: Math.round((completed / path.lessonIds.length) * 100),
  };
}

export function getNextLessonInPath(
  pathId: string,
  completedLessons: string[]
): string | null {
  const path = getPathById(pathId);
  if (!path) return null;
  return path.lessonIds.find((id) => !completedLessons.includes(id)) ?? null;
}

export function getContinueLessonId(completedLessons: string[]): string | null {
  for (const path of ACADEMY_PATHS) {
    const next = getNextLessonInPath(path.id, completedLessons);
    if (next) return next;
  }
  return null;
}

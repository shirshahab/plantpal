import type { AcademyCertificate } from "./types";

export const ACADEMY_CERTIFICATES: AcademyCertificate[] = [
  {
    id: "cert-beginner-gardening",
    title: "Gardening Foundations",
    description: "Completed all Beginner Gardening lessons.",
    pathId: "beginner-gardening",
    icon: "🌱",
  },
  {
    id: "cert-soil-mastery",
    title: "Soil Specialist",
    description: "Mastered soil science fundamentals.",
    pathId: "soil-mastery",
    icon: "🪨",
  },
  {
    id: "cert-water-mastery",
    title: "Water Specialist",
    description: "Expert in plant hydration and irrigation.",
    pathId: "water-mastery",
    icon: "💧",
  },
  {
    id: "cert-fertilizer-mastery",
    title: "Feeding Specialist",
    description: "Understands NPK and fertilization timing.",
    pathId: "fertilizer-mastery",
    icon: "🧪",
  },
  {
    id: "cert-plant-health",
    title: "Plant Health Specialist",
    description: "Diagnoses common plant problems confidently.",
    pathId: "plant-health",
    icon: "🩺",
  },
  {
    id: "cert-garden-bugs",
    title: "Garden Entomologist",
    description: "Knows friends and foes in the garden.",
    pathId: "garden-bugs",
    icon: "🐛",
  },
  {
    id: "cert-fruit-trees",
    title: "Fruit Tree Expert",
    description: "Ready to grow productive fruit trees.",
    pathId: "fruit-trees",
    icon: "🍊",
  },
  {
    id: "cert-bonsai",
    title: "Bonsai Apprentice",
    description: "Completed bonsai fundamentals.",
    pathId: "bonsai",
    icon: "🌳",
  },
  {
    id: "cert-vegetable-gardening",
    title: "Veggie Gardener",
    description: "Ready for a productive edible garden.",
    pathId: "vegetable-gardening",
    icon: "🍅",
  },
  {
    id: "cert-landscaping",
    title: "Garden Designer",
    description: "Understands outdoor design principles.",
    pathId: "landscaping",
    icon: "🏡",
  },
  {
    id: "cert-master-gardener",
    title: "Master Gardener",
    description: "Completed every Academy learning path.",
    pathId: "*",
    icon: "🏆",
  },
];

export function getCertificateForPath(pathId: string): AcademyCertificate | undefined {
  return ACADEMY_CERTIFICATES.find((c) => c.pathId === pathId);
}

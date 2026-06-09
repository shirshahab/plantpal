import type { Plant } from "@/lib/types";

export function daysSince(date: string | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export function needsWaterToday(plant: Plant): boolean {
  const days = daysSince(plant.lastWateredAt);
  if (days === null) return true;
  return days >= plant.waterFrequencyDays;
}

export function needsFertilizerSoon(plant: Plant): boolean {
  const days = daysSince(plant.lastFertilizedAt);
  const thresholdWeeks = plant.fertilizeFrequencyWeeks;
  if (days === null) return true;
  return days >= thresholdWeeks * 7 - 7;
}

export function hasHealthAlert(plant: Plant): boolean {
  return (
    plant.healthStatus === "needs_attention" ||
    plant.healthStatus === "critical"
  );
}

export function getDashboardStats(plants: Plant[]) {
  return {
    total: plants.length,
    needsWater: plants.filter(needsWaterToday).length,
    needsFertilizer: plants.filter(needsFertilizerSoon).length,
    healthAlerts: plants.filter(hasHealthAlert).length,
  };
}

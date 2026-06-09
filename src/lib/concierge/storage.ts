import type { SavedConciergePlan } from "./types";

export const CONCIERGE_PLANS_KEY = "plantpal-concierge-plans";

export function loadConciergePlans(): SavedConciergePlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONCIERGE_PLANS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedConciergePlan[];
  } catch {
    return [];
  }
}

export function saveConciergePlans(plans: SavedConciergePlan[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONCIERGE_PLANS_KEY, JSON.stringify(plans));
}

export function saveConciergePlan(plan: SavedConciergePlan): void {
  const existing = loadConciergePlans();
  const idx = existing.findIndex((p) => p.id === plan.id);
  const next =
    idx >= 0 ? existing.map((p) => (p.id === plan.id ? plan : p)) : [plan, ...existing];
  saveConciergePlans(next);
}

export function getConciergePlansForPlant(plantId: string): SavedConciergePlan[] {
  return loadConciergePlans().filter((p) => p.plantId === plantId);
}

export async function fetchRemoteConciergePlans(): Promise<SavedConciergePlan[]> {
  try {
    const res = await fetch("/api/concierge-plans");
    const json = (await res.json()) as { ok: boolean; plans?: SavedConciergePlan[] };
    return json.ok && json.plans ? json.plans : [];
  } catch {
    return [];
  }
}

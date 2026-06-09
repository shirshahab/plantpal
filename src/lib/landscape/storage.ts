import type { LandscapeProject } from "./types";
import { normalizeGardenStyle } from "./garden-styles";
import { normalizeDesign } from "./normalize-design";

export const LANDSCAPE_PROJECTS_KEY = "plantpal-landscape-projects";

function normalizeProject(raw: Partial<LandscapeProject> & { inspiration?: string }): LandscapeProject {
  const photo = raw.photoDataUrl ?? raw.photos?.[0]?.dataUrl ?? "";
  return {
    id: raw.id ?? crypto.randomUUID(),
    name: raw.name ?? "Landscape project",
    spaceType: raw.spaceType ?? "back_yard",
    zipCode: raw.zipCode ?? "",
    sunExposure: raw.sunExposure ?? "mixed",
    yardSize: raw.yardSize ?? "unknown",
    budgetRange: raw.budgetRange ?? "flexible",
    styleGoal: normalizeGardenStyle(raw.styleGoal ?? "modern"),
    notes: raw.notes ?? raw.inspiration ?? "",
    photos: raw.photos?.length ? raw.photos : photo ? [{ dataUrl: photo, label: "Primary" }] : [],
    design: normalizeDesign(raw.design ?? {}),
    visualConceptRequested: raw.visualConceptRequested ?? false,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    photoDataUrl: photo,
  };
}

export function loadLandscapeProjects(): LandscapeProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LANDSCAPE_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<LandscapeProject> & { inspiration?: string }>;
    return parsed
      .filter((p) => p.design)
      .map((p) => normalizeProject(p));
  } catch {
    return [];
  }
}

export function saveLandscapeProjects(projects: LandscapeProject[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LANDSCAPE_PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    /* quota */
  }
}

export function saveLandscapeProject(project: LandscapeProject): boolean {
  const normalized = normalizeProject(project);
  const existing = loadLandscapeProjects();
  const idx = existing.findIndex((p) => p.id === normalized.id);
  const next =
    idx >= 0
      ? existing.map((p) => (p.id === normalized.id ? normalized : p))
      : [normalized, ...existing];
  try {
    saveLandscapeProjects(next);
    return true;
  } catch {
    return false;
  }
}

export function deleteLandscapeProject(id: string): void {
  saveLandscapeProjects(loadLandscapeProjects().filter((p) => p.id !== id));
}

export function getLandscapeProject(id: string): LandscapeProject | undefined {
  return loadLandscapeProjects().find((p) => p.id === id);
}

export async function fetchRemoteLandscapeProjects(): Promise<LandscapeProject[]> {
  try {
    const res = await fetch("/api/landscape-projects");
    const json = (await res.json()) as {
      ok: boolean;
      projects?: LandscapeProject[];
    };
    if (json.ok && json.projects?.length) return json.projects;
    return [];
  } catch {
    return [];
  }
}

export async function syncLandscapeProjectToRemote(
  project: LandscapeProject
): Promise<"supabase" | "local"> {
  try {
    const res = await fetch("/api/landscape-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project }),
    });
    const json = (await res.json()) as { ok: boolean; storage?: "supabase" | "local" };
    return json.storage === "supabase" ? "supabase" : "local";
  } catch {
    return "local";
  }
}

export async function deleteRemoteLandscapeProject(id: string): Promise<void> {
  try {
    await fetch(`/api/landscape-projects?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch {
    /* local-only fallback */
  }
}

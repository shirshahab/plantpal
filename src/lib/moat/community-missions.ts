import { readLocalJson, removeLocalKey } from "@/lib/storage/safe-local-storage";

export type MissionCadence = "daily" | "weekly";
export type MissionStatus = "pending" | "completed" | "claimed";

export interface CommunityMission {
  id: string;
  cadence: MissionCadence;
  title: string;
  description: string;
  emoji: string;
  target: number;
  progress: number;
  rewardXp: number;
  rewardBadge?: string;
  status: MissionStatus;
}

export interface MissionStreak {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
}

export const STREAK_MILESTONES = [7, 30, 100] as const;

export function buildDailyMissions(): CommunityMission[] {
  return [
    {
      id: "dm-identify",
      cadence: "daily",
      title: "Identify 1 plant",
      description: "Use the scanner to ID any plant",
      emoji: "🔍",
      target: 1,
      progress: 0,
      rewardXp: 25,
      status: "pending",
    },
    {
      id: "dm-water",
      cadence: "daily",
      title: "Water 3 plants",
      description: "Log watering for three plants",
      emoji: "💧",
      target: 3,
      progress: 0,
      rewardXp: 20,
      status: "pending",
    },
    {
      id: "dm-lesson",
      cadence: "daily",
      title: "Complete 1 lesson",
      description: "Finish any Academy lesson",
      emoji: "📚",
      target: 1,
      progress: 0,
      rewardXp: 30,
      status: "pending",
    },
  ];
}

export function buildWeeklyMissions(): CommunityMission[] {
  return [
    {
      id: "wm-photos",
      cadence: "weekly",
      title: "Add 5 growth photos",
      description: "Track progress with photos",
      emoji: "📸",
      target: 5,
      progress: 0,
      rewardXp: 75,
      rewardBadge: "Growth Photographer",
      status: "pending",
    },
    {
      id: "wm-diagnose",
      cadence: "weekly",
      title: "Diagnose a plant",
      description: "Run Plant Doctor on any issue",
      emoji: "🩺",
      target: 1,
      progress: 0,
      rewardXp: 50,
      status: "pending",
    },
    {
      id: "wm-path",
      cadence: "weekly",
      title: "Finish a learning path",
      description: "Complete all lessons in any Academy path",
      emoji: "🏆",
      target: 1,
      progress: 0,
      rewardXp: 100,
      rewardBadge: "Path Finisher",
      status: "pending",
    },
  ];
}

const STORAGE_KEY = "plantpal-community-missions";

export interface MissionState {
  daily: CommunityMission[];
  weekly: CommunityMission[];
  streak: MissionStreak;
  lastResetDaily: string | null;
  lastResetWeekly: string | null;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekKey(): string {
  const d = new Date();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

export function loadMissionState(): MissionState {
  if (typeof window === "undefined") {
    return {
      daily: buildDailyMissions(),
      weekly: buildWeeklyMissions(),
      streak: { current: 0, longest: 0, lastCompletedDate: null },
      lastResetDaily: null,
      lastResetWeekly: null,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        daily: buildDailyMissions(),
        weekly: buildWeeklyMissions(),
        streak: { current: 0, longest: 0, lastCompletedDate: null },
        lastResetDaily: todayKey(),
        lastResetWeekly: weekKey(),
      };
    }
    const state = JSON.parse(raw) as MissionState;
    if (state.lastResetDaily !== todayKey()) {
      state.daily = buildDailyMissions();
      state.lastResetDaily = todayKey();
    }
    if (state.lastResetWeekly !== weekKey()) {
      state.weekly = buildWeeklyMissions();
      state.lastResetWeekly = weekKey();
    }
    return state;
  } catch {
    removeLocalKey(STORAGE_KEY);
    return {
      daily: buildDailyMissions(),
      weekly: buildWeeklyMissions(),
      streak: { current: 0, longest: 0, lastCompletedDate: null },
      lastResetDaily: todayKey(),
      lastResetWeekly: weekKey(),
    };
  }
}

export function saveMissionState(state: MissionState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function completeMission(
  state: MissionState,
  missionId: string
): { state: MissionState; xpEarned: number } {
  const all = [...state.daily, ...state.weekly];
  const mission = all.find((m) => m.id === missionId);
  if (!mission || mission.status === "completed" || mission.status === "claimed") {
    return { state, xpEarned: 0 };
  }

  mission.progress = mission.target;
  mission.status = "completed";

  const today = todayKey();
  let streak = { ...state.streak };
  if (streak.lastCompletedDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    streak.current = streak.lastCompletedDate === yKey ? streak.current + 1 : 1;
    streak.longest = Math.max(streak.longest, streak.current);
    streak.lastCompletedDate = today;
  }

  const newState = { ...state, streak };
  saveMissionState(newState);
  return { state: newState, xpEarned: mission.rewardXp };
}

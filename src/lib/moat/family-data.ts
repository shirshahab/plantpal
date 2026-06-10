export interface FamilyMember {
  id: string;
  name: string;
  role: "parent" | "child" | "roommate";
  avatar: string;
  totalXp: number;
  plantsMaintained: number;
  wateringStreak: number;
  badgesEarned: number;
}

export interface FamilyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  unit: string;
  rewardXp: number;
  rewardBadge: string;
  endsAt: string;
}

export interface FamilyHousehold {
  id: string;
  name: string;
  inviteCode: string;
  members: FamilyMember[];
  totalFamilyXp: number;
  activeChallenge: FamilyChallenge | null;
}

const HOUSEHOLD_STORAGE_KEY = "plantpal-household";
const LEGACY_DEMO_HOUSEHOLD_ID = "demo-household";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `PLANT-${code}`;
}

/** Load the user's real household, if they created one. Purges legacy demo data. */
export function loadHousehold(): FamilyHousehold | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FamilyHousehold;
    if (parsed.id === LEGACY_DEMO_HOUSEHOLD_ID) {
      localStorage.removeItem(HOUSEHOLD_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveHousehold(household: FamilyHousehold): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(household));
}

/** Create a real household with the current user as the first member. */
export function createHousehold(
  name: string,
  memberName: string,
  role: FamilyMember["role"] = "parent"
): FamilyHousehold {
  const household: FamilyHousehold = {
    id: `household-${Date.now()}`,
    name: name.trim() || "My Household",
    inviteCode: generateInviteCode(),
    totalFamilyXp: 0,
    members: [
      {
        id: "you",
        name: memberName.trim() || "You",
        role,
        avatar: "🧑‍🌾",
        totalXp: 0,
        plantsMaintained: 0,
        wateringStreak: 0,
        badgesEarned: 0,
      },
    ],
    activeChallenge: null,
  };
  saveHousehold(household);
  return household;
}

export const FAMILY_CHALLENGE_TEMPLATES: Omit<FamilyChallenge, "id" | "progress" | "endsAt">[] = [
  {
    title: "Water 20 plants this week",
    description: "Team hydration streak",
    target: 20,
    unit: "plants watered",
    rewardXp: 150,
    rewardBadge: "Hydration Heroes",
  },
  {
    title: "Add 5 growth photos",
    description: "Document your garden's progress",
    target: 5,
    unit: "photos",
    rewardXp: 100,
    rewardBadge: "Growth Trackers",
  },
  {
    title: "Complete 3 Academy lessons",
    description: "Learn together as a family",
    target: 3,
    unit: "lessons",
    rewardXp: 120,
    rewardBadge: "Family Scholars",
  },
];

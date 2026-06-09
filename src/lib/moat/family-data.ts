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

export const DEMO_HOUSEHOLD: FamilyHousehold = {
  id: "demo-household",
  name: "The PlantPal Family",
  inviteCode: "PLANT-7K2M",
  totalFamilyXp: 8000,
  members: [
    {
      id: "dad",
      name: "Dad",
      role: "parent",
      avatar: "👨‍🌾",
      totalXp: 4200,
      plantsMaintained: 12,
      wateringStreak: 14,
      badgesEarned: 8,
    },
    {
      id: "emma",
      name: "Emma",
      role: "child",
      avatar: "👧",
      totalXp: 2100,
      plantsMaintained: 5,
      wateringStreak: 7,
      badgesEarned: 4,
    },
    {
      id: "liam",
      name: "Liam",
      role: "child",
      avatar: "👦",
      totalXp: 1700,
      plantsMaintained: 3,
      wateringStreak: 5,
      badgesEarned: 3,
    },
  ],
  activeChallenge: {
    id: "fc-water-20",
    title: "Water 20 plants this week",
    description: "Keep the whole garden hydrated together.",
    target: 20,
    progress: 13,
    unit: "plants watered",
    rewardXp: 150,
    rewardBadge: "Hydration Heroes",
    endsAt: new Date(Date.now() + 4 * 86400000).toISOString(),
  },
};

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

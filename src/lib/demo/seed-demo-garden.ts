/**
 * Seeds a polished demo garden into localStorage for pitches and testing.
 * Call before navigating to /dashboard — then reload or let providers pick up on next visit.
 */

import type { AICarePlanResponse, AIPriceCheckResponse } from "@/lib/types/ai";
import type { GrowthEntry } from "@/lib/types/phase6";
import type { PlantMission, PlantMilestone, UserPlantGoal } from "@/lib/types/care-goals";
import type { StoredPlantPhoto } from "@/lib/db/photos";
import { DEMO_GARDEN_PLANTS } from "@/lib/mock/plants";
import { saveUserProfile } from "@/lib/profile/user-profile";
import type { PlantGenomeRecord } from "@/lib/genome/types";

const LEMON_CARE_PLAN: AICarePlanResponse = {
  watering_schedule: "Deep water every 3 days in summer; check soil moisture before each watering.",
  fertilizer_schedule: "Citrus-specific feed every 6 weeks March through September.",
  pruning_schedule: "Shape in late winter; remove dead wood and water sprouts.",
  soil_recommendation: "Well-draining citrus mix with pH 6.0–6.5.",
  seasonal_tasks: [
    "Protect from frost below 32°F",
    "Increase water during heat waves",
    "Harvest when fruit yields slightly to touch",
  ],
  goal_adjustments: ["Focus on fruit set — reduce nitrogen in late summer."],
  warning_signs: ["Yellow leaves with green veins = iron deficiency", "Leaf curl = underwatering"],
  next_7_days: [
    "Check soil moisture — top inch should dry before watering",
    "Inspect for citrus leafminer on new growth",
    "Apply deep soak before Friday heat",
  ],
  next_30_days: [
    "Feed with citrus fertilizer mid-month",
    "Thin heavy fruit clusters if branch is bending",
    "Monitor for aphids on tender shoots",
  ],
  source: "mock",
};

const AVOCADO_PRICE_CHECK: AIPriceCheckResponse = {
  corrected_plant_name: "Avocado Tree",
  estimated_price_range: "$45 – $85 for 3 gallon in Southern California",
  good_buy_price: "Under $65 for a healthy grafted tree",
  overpriced_above: "$90+ unless larger specimen",
  what_to_look_for: [
    "Graft union visible and healed",
    "No brown leaf tips",
    "Roots not circling the pot",
  ],
  red_flags: ["Wilting in morning", "Root-bound in small pot", "No graft tag"],
  better_alternatives: ["5 gallon if budget allows — faster fruit timeline"],
  buy_pass_verdict: "Good Buy",
  source: "mock",
};

function buildDemoGenome(): Record<string, PlantGenomeRecord> {
  const now = Date.now();
  return {
    "1": {
      plantId: "1",
      lastComputedAt: new Date(now).toISOString(),
      events: [
        {
          id: "demo-ge-1",
          plantId: "1",
          type: "growth_measurement",
          payload: { heightInches: 48, note: "Demo growth baseline" },
          recordedAt: new Date(now - 7 * 86400000).toISOString(),
        },
        {
          id: "demo-ge-2",
          plantId: "1",
          type: "health_scan",
          payload: { result: "healthy" },
          recordedAt: new Date(now - 14 * 86400000).toISOString(),
        },
        {
          id: "demo-ge-3",
          plantId: "1",
          type: "task_completed",
          payload: { taskType: "water", title: "Deep water Meyer Lemon" },
          recordedAt: new Date(now - 2 * 86400000).toISOString(),
        },
        {
          id: "demo-ge-4",
          plantId: "1",
          type: "photo_added",
          payload: { photoType: "growth" },
          recordedAt: new Date(now - 30 * 86400000).toISOString(),
        },
      ],
    },
  };
}

function buildDemoGrowth(): GrowthEntry[] {
  const now = Date.now();
  return [
    {
      id: "demo-growth-1",
      plantId: "1",
      userId: "demo-user",
      photoUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      heightInches: 36,
      note: "Repotted into 15-gallon container. Strong root flush.",
      entryDate: new Date(now - 60 * 86400000).toISOString(),
      createdAt: new Date(now - 60 * 86400000).toISOString(),
    },
    {
      id: "demo-growth-2",
      plantId: "1",
      userId: "demo-user",
      photoUrl: "https://images.unsplash.com/photo-1587735240108-8e8712816788?w=400&h=300&fit=crop",
      heightInches: 42,
      note: "First flower buds visible. Deep watered before heat wave.",
      entryDate: new Date(now - 30 * 86400000).toISOString(),
      createdAt: new Date(now - 30 * 86400000).toISOString(),
    },
    {
      id: "demo-growth-3",
      plantId: "1",
      userId: "demo-user",
      photoUrl: "https://images.unsplash.com/photo-1587735240108-8e8712816788?w=400&h=300&fit=crop",
      heightInches: 48,
      note: "Two lemons set. New flush of growth on south branch.",
      entryDate: new Date(now - 7 * 86400000).toISOString(),
      createdAt: new Date(now - 7 * 86400000).toISOString(),
    },
  ];
}

function buildDemoPhotos(): StoredPlantPhoto[] {
  const now = Date.now();
  return [
    {
      id: "demo-photo-1",
      userId: "demo-user",
      plantId: "1",
      photoUrl: "https://images.unsplash.com/photo-1587735240108-8e8712816788?w=400&h=300&fit=crop",
      photoType: "identification",
      notes: "Identified as Meyer Lemon",
      metadata: { common_name: "Meyer Lemon", confidence: "high" },
      createdAt: new Date(now - 14 * 86400000).toISOString(),
    },
    {
      id: "demo-photo-2",
      userId: "demo-user",
      plantId: "4",
      photoUrl: "https://images.unsplash.com/photo-1593691509543-c55fb32dca61?w=400&h=300&fit=crop",
      photoType: "health_scan",
      notes: "Yellow leaves on lower branches — possible overwatering",
      metadata: { issue_detected: "Yellowing leaves", severity: "moderate" },
      createdAt: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      id: "demo-photo-3",
      userId: "demo-user",
      plantId: "1",
      photoUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      photoType: "growth",
      notes: "Monthly progress photo",
      metadata: {},
      createdAt: new Date(now - 7 * 86400000).toISOString(),
    },
  ];
}

function buildDemoGoals(): UserPlantGoal[] {
  const now = new Date().toISOString();
  return [
    { id: "dg-1", userId: "demo-user", plantId: "1", goalId: "more-fruit", priority: 1, isPrimary: true, createdAt: now },
    { id: "dg-2", userId: "demo-user", plantId: "4", goalId: "more-flowers", priority: 1, isPrimary: true, createdAt: now },
    { id: "dg-3", userId: "demo-user", plantId: "5", goalId: "more-fruit", priority: 1, isPrimary: true, createdAt: now },
    { id: "dg-4", userId: "demo-user", plantId: "2", goalId: "stronger-structure", priority: 1, isPrimary: true, createdAt: now },
    { id: "dg-5", userId: "demo-user", plantId: "3", goalId: "fuller-growth", priority: 1, isPrimary: true, createdAt: now },
  ];
}

function buildDemoMissions(): PlantMission[] {
  const now = new Date().toISOString();
  return [
    {
      id: "demo-mission-1",
      plantId: "1",
      userId: "demo-user",
      title: "Feed for fruit set",
      description: "Apply low-nitrogen citrus fertilizer to support developing lemons.",
      season: "Spring",
      taskType: "fertilize",
      status: "active",
      rewardPoints: 15,
      completedAt: null,
      createdAt: now,
    },
    {
      id: "demo-mission-2",
      plantId: "4",
      userId: "demo-user",
      title: "Inspect for pests",
      description: "Check bougainvillea lower leaves for aphids or leaf spot.",
      season: "Spring",
      taskType: "inspect",
      status: "active",
      rewardPoints: 10,
      completedAt: null,
      createdAt: now,
    },
  ];
}

function buildDemoMilestones(): PlantMilestone[] {
  const now = new Date().toISOString();
  return [
    {
      id: "demo-ms-1",
      plantId: "1",
      userId: "demo-user",
      title: "First flower buds",
      description: "Meyer lemon produced its first flower buds.",
      targetDate: null,
      status: "completed",
      completedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      createdAt: now,
    },
    {
      id: "demo-ms-2",
      plantId: "1",
      userId: "demo-user",
      title: "First fruit set",
      description: "Two lemons are developing on the south branch.",
      targetDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      status: "in_progress",
      completedAt: null,
      createdAt: now,
    },
  ];
}

/** Write full demo state to localStorage. Returns true on success. */
export function seedDemoGarden(zipCode = "91107"): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem("plantpal-plants", JSON.stringify(DEMO_GARDEN_PLANTS));
    localStorage.setItem(
      "plantpal-ai-results",
      JSON.stringify({
        carePlans: { "1": LEMON_CARE_PLAN },
        doctorByPlant: {
          "4": [
            {
              likely_issue: "Yellowing leaves from overwatering",
              confidence: "high",
              possible_causes: ["Overwatering", "Poor drainage", "Root stress"],
              what_to_do_today: "Let soil dry completely. Check drainage holes.",
              what_to_avoid: "Do not water until top 2 inches are dry.",
              when_to_check_back: "Rescan in 5–7 days after adjusting water.",
              severity: "moderate",
              needs_professional_help: false,
              source: "mock",
            },
          ],
        },
        goalPlans: {},
        lastPriceCheck: AVOCADO_PRICE_CHECK,
      })
    );
    localStorage.setItem("plantpal-growth", JSON.stringify(buildDemoGrowth()));
    localStorage.setItem("plantpal-genomes", JSON.stringify(buildDemoGenome()));
    localStorage.setItem("plantpal-photo-history", JSON.stringify(buildDemoPhotos()));
    localStorage.setItem("plantpal-user-plant-goals", JSON.stringify(buildDemoGoals()));
    localStorage.setItem("plantpal-plant-missions", JSON.stringify(buildDemoMissions()));
    localStorage.setItem("plantpal-plant-milestones", JSON.stringify(buildDemoMilestones()));
    localStorage.setItem(
      "plantpal-achievements",
      JSON.stringify({
        "first-plant": new Date().toISOString(),
        "first-tree": new Date().toISOString(),
        "first-scan": new Date().toISOString(),
        "citrus-expert": new Date().toISOString(),
        "first-growth-photo": new Date().toISOString(),
      })
    );
    localStorage.setItem(
      "plantpal-stats",
      JSON.stringify({ scans: 3, wateringStreak: 5, firstPlantDate: new Date(Date.now() - 90 * 86400000).toISOString() })
    );
    localStorage.removeItem("plantpal-task-states");
    localStorage.removeItem("plantpal-care-logs");

    saveUserProfile({
      onboardingComplete: true,
      demoMode: true,
      zipCode,
      growTypes: ["fruit_trees", "flowers", "indoor"],
      experienceLevel: "intermediate",
      mainGoal: "more_fruit",
      completedAt: new Date().toISOString(),
    });

    return true;
  } catch (e) {
    console.error("[demo] seed failed:", e);
    return false;
  }
}

export function exitDemoMode(): void {
  saveUserProfile({ demoMode: false });
}

/** Clear demo garden data and turn off demo mode. */
export function exitDemoGarden(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("plantpal-plants", "[]");
    localStorage.removeItem("plantpal-growth");
    localStorage.removeItem("plantpal-genomes");
    localStorage.removeItem("plantpal-photo-history");
    localStorage.removeItem("plantpal-user-plant-goals");
    localStorage.removeItem("plantpal-plant-missions");
    localStorage.removeItem("plantpal-plant-milestones");
    localStorage.removeItem("plantpal-ai-care-plans");
    localStorage.removeItem("plantpal-ai-goal-plans");
    localStorage.removeItem("plantpal-task-states");
    saveUserProfile({ demoMode: false });
  } catch (e) {
    console.error("[demo] exit failed:", e);
    exitDemoMode();
  }
}

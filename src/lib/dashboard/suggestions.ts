/**
 * Smart dashboard suggestions — personalized next steps based on the
 * user's real plants, location, learning progress, and activity.
 */
import type { Plant } from "@/lib/types";
import type { UserProfile } from "@/lib/types/profile";
import { getTrendingPlantsForZip, getAreaLabel } from "./trending-plants";

export interface DashboardSuggestion {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
}

export interface SuggestionInput {
  plants: Plant[];
  profile: UserProfile;
  completedLessons: string[];
  scanCount: number;
  friendsCount: number;
  growthPhotoCount: number;
}

export function buildDashboardSuggestions(
  input: SuggestionInput,
  limit = 4
): DashboardSuggestion[] {
  const { plants, profile, completedLessons, scanCount, friendsCount, growthPhotoCount } = input;
  const suggestions: DashboardSuggestion[] = [];

  if (!profile.onboardingComplete) {
    suggestions.push({
      id: "finish-onboarding",
      icon: "✅",
      title: "Finish setting up your account",
      description: "Tell us your ZIP and goals for personalized care.",
      href: "/onboarding",
    });
  }

  if (plants.length === 0) {
    suggestions.push({
      id: "add-first-plant",
      icon: "🌱",
      title: "Add your first plant",
      description: "Your garden command center comes alive with your first plant.",
      href: "/plants/new",
    });
  }

  if (!profile.zipCode) {
    suggestions.push({
      id: "add-zip",
      icon: "📍",
      title: "Add your ZIP code",
      description: "Get local weather alerts and plants trending near you.",
      href: "/settings",
    });
  }

  if (plants.length > 0 && scanCount === 0) {
    suggestions.push({
      id: "first-scan",
      icon: "📷",
      title: "Scan a plant you already own",
      description: "Get an instant health check and identification.",
      href: "/scanner",
    });
  }

  if (!completedLessons.includes("watering-basics")) {
    suggestions.push({
      id: "watering-basics",
      icon: "💧",
      title: "Take Watering Basics",
      description: "The 3-minute lesson that prevents the #1 plant killer.",
      href: "/academy/lesson/watering-basics",
    });
  }

  if (profile.zipCode) {
    const trending = getTrendingPlantsForZip(profile.zipCode, plants, 1)[0];
    if (trending) {
      suggestions.push({
        id: "try-trending",
        icon: "🔥",
        title: `Try ${trending.name} in ${getAreaLabel(profile.zipCode)}`,
        description: "A great match for your local climate.",
        href: trending.speciesId
          ? `/plants/new?speciesId=${encodeURIComponent(trending.speciesId)}`
          : "/plants/new",
      });
    }
  }

  if (friendsCount === 0) {
    suggestions.push({
      id: "invite-friend",
      icon: "👨‍👩‍👧",
      title: "Invite a family member",
      description: "Gardens grow better together. Share wins and tips.",
      href: "/invite",
    });
  }

  if (plants.length > 0 && growthPhotoCount === 0) {
    suggestions.push({
      id: "first-growth-photo",
      icon: "📈",
      title: "Upload your first growth photo",
      description: "Track progress with before & after shots.",
      href: `/plants/${plants[0].id}`,
    });
  }

  if (plants.length > 0 && completedLessons.length > 0 && suggestions.length < limit) {
    suggestions.push({
      id: "browse-database",
      icon: "📚",
      title: "Explore the plant database",
      description: "Care guides, soil matches, and pest risks for 100+ plants.",
      href: "/database",
    });
  }

  return suggestions.slice(0, limit);
}

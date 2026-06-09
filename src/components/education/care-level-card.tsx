"use client";

import { Sprout } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "./progress-bar";
import { useEducation } from "@/lib/store/education-provider";

const levelEmoji: Record<string, string> = {
  Seedling: "🌱",
  Sprout: "🌿",
  Grower: "🪴",
  Gardener: "🌳",
  "Plant Pro": "🏆",
};

export function CareLevelCard({ compact }: { compact?: boolean }) {
  const { levelInfo, progress } = useEducation();

  return (
    <Card padding="md" className="bg-gradient-to-br from-green-50 to-white">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white border border-green-100 flex items-center justify-center text-2xl shadow-sm">
          {levelEmoji[levelInfo.current] ?? "🌱"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
              Care Level
            </p>
          </div>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {levelInfo.current}
          </p>
          {!compact && levelInfo.next && (
            <>
              <p className="text-sm text-gray-500 mt-1">
                Complete {levelInfo.lessonsUntilNext} more lesson
                {levelInfo.lessonsUntilNext !== 1 ? "s" : ""} to become a{" "}
                <span className="font-medium text-green-700">
                  {levelInfo.next}
                </span>
              </p>
              <ProgressBar
                value={levelInfo.progressPercent}
                className="mt-3"
              />
            </>
          )}
          {compact && (
            <p className="text-xs text-gray-500 mt-1">
              {progress.completedLessons.length} lesson
              {progress.completedLessons.length !== 1 ? "s" : ""} completed
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

"use client";

import Link from "next/link";
import type { Plant } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { calculateGardenScore } from "@/lib/scoring";
import { HealthScoreBadge, HealthScoreRing } from "./health-score-badge";

export function GardenScoreCard({ plants }: { plants: Plant[] }) {
  const garden = calculateGardenScore(plants);

  return (
    <Card padding="md" className="bg-gradient-to-br from-green-50 to-white border-green-100">
      <div className="flex items-start gap-4">
        <div className="relative flex items-center justify-center">
          <HealthScoreRing score={garden.score} size={64} />
          <span className="absolute text-lg font-bold text-gray-900">{garden.score}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
            Garden Score
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900">{garden.score}</span>
            <span className="text-sm text-gray-500">/ 100</span>
            <HealthScoreBadge score={garden.score} size="sm" showLabel={false} />
          </div>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{garden.recommendation}</p>
        </div>
      </div>

      {garden.topPlants.length > 0 && (
        <div className="mt-4 pt-4 border-t border-green-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-medium text-gray-500 mb-1.5">Top performers</p>
            {garden.topPlants.slice(0, 3).map(({ plant, score }) => (
              <Link
                key={plant.id}
                href={`/plants/${plant.id}`}
                className="flex justify-between py-1 text-gray-700 hover:text-green-700"
              >
                <span className="truncate">{plant.name}</span>
                <span className="font-semibold text-green-600">{score}</span>
              </Link>
            ))}
          </div>
          <div>
            <p className="font-medium text-gray-500 mb-1.5">Needs attention</p>
            {garden.bottomPlants.slice(0, 3).map(({ plant, score }) => (
              <Link
                key={plant.id}
                href={`/plants/${plant.id}`}
                className="flex justify-between py-1 text-gray-700 hover:text-green-700"
              >
                <span className="truncate">{plant.name}</span>
                <span className={score < 75 ? "font-semibold text-amber-600" : "font-semibold text-green-600"}>
                  {score}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

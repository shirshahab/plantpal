"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Target,
  Flag,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Plant } from "@/lib/types";
import { useJourney } from "@/lib/store/journey-provider";
import { EditGoalsModal } from "@/components/journey/edit-goals-modal";
import { GenerateGoalPlanButton } from "@/components/ai/ai-plant-actions";
import { formatDate } from "@/lib/utils";

interface PlantJourneySectionProps {
  plant: Plant;
}

export function PlantJourneySection({ plant }: PlantJourneySectionProps) {
  const {
    getJourneySummary,
    getMilestones,
    completeMilestone,
    completeMission,
    skipMission,
  } = useJourney();
  const [editOpen, setEditOpen] = useState(false);

  const summary = getJourneySummary(plant);
  const milestones = getMilestones(plant.id);

  if (summary.selectedGoals.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <Target className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="font-medium text-gray-900">No goals yet</p>
          <p className="text-sm text-gray-500">
            Add a goal and we&apos;ll build a plant journey around it.
          </p>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            Add goals
          </Button>
          <EditGoalsModal
            plant={plant}
            open={editOpen}
            onClose={() => setEditOpen(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Plant Journey</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-green-700"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-4 h-4" />
              Edit goals
            </Button>
          </div>
          <GenerateGoalPlanButton plant={plant} />
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Journey progress</span>
              <span>{summary.progressPercent}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${summary.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Goals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <p className="text-xs text-green-700 font-medium uppercase">Your goal</p>
              <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
                <span>{summary.primaryGoal?.icon}</span>
                {summary.primaryGoal?.name ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <p className="text-xs text-blue-700 font-medium uppercase">Current stage</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {summary.currentStage}
              </p>
            </div>
          </div>

          {summary.selectedGoals.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {summary.selectedGoals.map((g) => (
                <span
                  key={g.id}
                  className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"
                >
                  {g.icon} {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Next milestone */}
          {summary.nextMilestone && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <div className="flex items-start gap-3">
                <Flag className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-800 uppercase">
                    Next milestone
                  </p>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {summary.nextMilestone.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {summary.nextMilestone.description}
                  </p>
                  {summary.nextMilestone.targetDate && (
                    <p className="text-xs text-gray-400 mt-2">
                      Target: {formatDate(summary.nextMilestone.targetDate)}
                    </p>
                  )}
                </div>
                {summary.nextMilestone.status === "in_progress" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => completeMilestone(summary.nextMilestone!.id)}
                  >
                    Done
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Active missions */}
          {summary.activeMissions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">
                This week&apos;s missions
              </p>
              <div className="space-y-2">
                {summary.activeMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <Circle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {mission.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {mission.description}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        +{mission.rewardPoints} pts · {mission.season}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => completeMission(mission.id)}
                      >
                        Done
                      </Button>
                      <button
                        type="button"
                        className="text-[10px] text-gray-400 hover:text-gray-600"
                        onClick={() => skipMission(mission.id)}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Milestone timeline */}
          {milestones.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Milestones</p>
              <div className="space-y-2">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    {m.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <Circle
                        className={`w-4 h-4 shrink-0 ${
                          m.status === "in_progress"
                            ? "text-amber-500"
                            : "text-gray-300"
                        }`}
                      />
                    )}
                    <span
                      className={
                        m.status === "completed"
                          ? "text-gray-400 line-through"
                          : "text-gray-700"
                      }
                    >
                      {m.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-green-600 font-medium"
          >
            See all missions on dashboard
            <ChevronRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>

      <EditGoalsModal
        plant={plant}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}

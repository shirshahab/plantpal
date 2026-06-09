"use client";

import { Droplets, Sprout, Scissors, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Plant } from "@/lib/types";
import { useJourney } from "@/lib/store/journey-provider";
import { useAiResults } from "@/lib/store/ai-provider";
import { AiCarePlanDisplay } from "@/components/ai/ai-care-plan-display";

interface GoalAwareCareScheduleProps {
  plant: Plant;
  onMarkWatered: () => void;
}

export function GoalAwareCareSchedule({
  plant,
  onMarkWatered,
}: GoalAwareCareScheduleProps) {
  const { getCarePlan, getPrimaryGoal } = useJourney();
  const { getCarePlan: getAiCarePlan } = useAiResults();
  const plan = getCarePlan(plant);
  const primary = getPrimaryGoal(plant.id);
  const aiPlan = getAiCarePlan(plant.id);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Base care</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/80">
            <Droplets className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                Water every {plan.waterFrequencyDays} days
              </h4>
              <p className="text-sm text-gray-600 mt-1">{plan.wateringInstructions}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="touch-manipulation min-h-[44px]"
              onClick={onMarkWatered}
            >
              Mark Watered
            </Button>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50/80">
            <Sprout className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">
                Fertilize every {plan.fertilizeFrequencyWeeks} weeks
              </h4>
              <p className="text-sm text-gray-600 mt-1">{plan.fertilizingInstructions}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-50/80">
            <Scissors className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">
                Prune: {plan.pruneSchedule}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{plan.pruningInstructions}</p>
            </div>
          </div>
        </div>
      </div>

      {aiPlan && (
        <div className="rounded-xl border border-violet-100 bg-violet-50/30 p-4">
          <AiCarePlanDisplay plan={aiPlan} />
        </div>
      )}

      {primary && (
        <div className="rounded-xl border border-green-100 bg-green-50/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Goal adjustments · {primary.name}
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>💧 {plan.wateringAdjustment}</li>
            <li>🌿 {plan.fertilizerAdjustment}</li>
            <li>✂️ {plan.pruningAdjustment}</li>
            {plan.soilAdjustment && <li>🪴 {plan.soilAdjustment}</li>}
          </ul>
          {plan.seasonalTasks.length > 0 && (
            <div className="pt-2 border-t border-green-100">
              <p className="text-xs font-medium text-green-800 uppercase mb-1">
                Seasonal tasks
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                {plan.seasonalTasks.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </div>
          )}
          {plan.warnings.length > 0 && (
            <div className="flex gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg p-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{plan.warnings.join(" ")}</span>
            </div>
          )}
          {plan.goalSpecificTips.slice(0, 2).map((tip) => (
            <p key={tip} className="text-xs text-green-700 bg-white/60 rounded-lg px-3 py-2">
              Do this next: {tip}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

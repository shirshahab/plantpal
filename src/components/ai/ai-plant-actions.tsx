"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Plant } from "@/lib/types";
import { useJourney } from "@/lib/store/journey-provider";
import { useAiResults } from "@/lib/store/ai-provider";
import { useToast } from "@/lib/store/toast-provider";
import { requestCarePlan, requestGoalPlan } from "@/lib/ai/client";
import { buildCarePlanRequest, buildGoalPlanRequest } from "@/lib/ai/build-request";
import { friendlyAiError } from "@/lib/errors/user-messages";
import { trackEvent } from "@/lib/analytics/track";
import { AiCarePlanDisplay } from "@/components/ai/ai-care-plan-display";
import { AiGoalPlanDisplay } from "@/components/ai/ai-goal-plan-display";
import { CarePlanConfidence } from "@/components/ai/care-plan-confidence";
import { FeatureGate } from "@/components/subscription/feature-gate";

export function GenerateCarePlanButton({ plant }: { plant: Plant }) {
  const { getPlantGoals, getPrimaryGoal } = useJourney();
  const { getCarePlan, saveCarePlan } = useAiResults();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const goals = getPlantGoals(plant.id);
  const primary = getPrimaryGoal(plant.id);
  const existing = getCarePlan(plant.id);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const goals = getPlantGoals(plant.id);
    const primary = getPrimaryGoal(plant.id);
    const res = await requestCarePlan(buildCarePlanRequest(plant, goals, primary));
    setLoading(false);

    if (!res.ok) {
      setError(friendlyAiError(res.error, "care plan"));
      return;
    }

    saveCarePlan(plant.id, res.data);
    setSaved(res.saved);
    trackEvent("care_plan_generated", {
      plantId: plant.id,
      source: res.data.source,
    });
    toast(
      res.data.source === "ai"
        ? "Your care plan is ready."
        : "Care plan ready. Built from PlantPal's care library."
    );
  }

  return (
    <div className="space-y-4" id="ai-coach">
      <FeatureGate feature="ai_care_plans">
        <CarePlanConfidence plant={plant} goals={goals} />
        <Button
          className="w-full touch-manipulation"
          variant="secondary"
          loading={loading}
          onClick={handleGenerate}
        >
          <Sparkles className="w-4 h-4" />
          Generate Care Plan
        </Button>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        {existing && <AiCarePlanDisplay plan={existing} saved={saved} />}
      </FeatureGate>
    </div>
  );
}

export function GenerateGoalPlanButton({ plant }: { plant: Plant }) {
  const { getPlantGoals, getPrimaryGoal, applyAiGoalPlan } = useJourney();
  const { getGoalPlan, saveGoalPlan } = useAiResults();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const existing = getGoalPlan(plant.id);
  const goals = getPlantGoals(plant.id);

  async function handleGenerate() {
    if (goals.length === 0) {
      setError("Add at least one goal first.");
      return;
    }
    setLoading(true);
    setError(null);
    const primary = getPrimaryGoal(plant.id);
    const res = await requestGoalPlan(buildGoalPlanRequest(plant, goals, primary));
    setLoading(false);

    if (!res.ok) {
      setError(friendlyAiError(res.error, "goal plan"));
      return;
    }

    saveGoalPlan(plant.id, res.data);
    applyAiGoalPlan(plant.id, res.data);
    setSaved(res.saved);
    toast("Goal plan updated.");
  }

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        variant="secondary"
        loading={loading}
        disabled={goals.length === 0}
        onClick={handleGenerate}
      >
        <Sparkles className="w-4 h-4" />
        Generate Goal Plan
      </Button>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
      {existing && <AiGoalPlanDisplay plan={existing} saved={saved} />}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Droplets,
  Sprout,
  Scissors,
  Eye,
  Sparkles,
  CalendarDays,
  CalendarRange,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Plant } from "@/lib/types";
import { useJourney } from "@/lib/store/journey-provider";
import { useAiResults } from "@/lib/store/ai-provider";
import { AiCarePlanDisplay } from "@/components/ai/ai-care-plan-display";
import { EditGoalsModal } from "@/components/journey/edit-goals-modal";
import { getPruneForGrowthGuide } from "@/lib/care/prune-for-growth";
import { cn } from "@/lib/utils";

interface GoalAwareCareScheduleProps {
  plant: Plant;
  onMarkWatered: () => void;
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function SectionCard({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: React.ElementType;
  title: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border p-4 space-y-2", tone)}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TipList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-gray-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden className="text-gray-400">
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function GoalAwareCareSchedule({
  plant,
  onMarkWatered,
}: GoalAwareCareScheduleProps) {
  const { getCarePlan, getPlantGoals, getPrimaryGoal } = useJourney();
  const { getCarePlan: getAiCarePlan } = useAiResults();
  const [editGoalsOpen, setEditGoalsOpen] = useState(false);
  const [showPruneDetail, setShowPruneDetail] = useState(false);

  const plan = getCarePlan(plant);
  const goals = getPlantGoals(plant.id);
  const primary = getPrimaryGoal(plant.id);
  const aiPlan = getAiCarePlan(plant.id);
  const pruneGuide = useMemo(
    () => getPruneForGrowthGuide(plant.species, plant.name),
    [plant.species, plant.name]
  );

  const sinceWater = daysSince(plant.lastWateredAt);
  const waterDueIn =
    sinceWater == null ? 0 : plan.waterFrequencyDays - sinceWater;
  const sinceFert = daysSince(plant.lastFertilizedAt);
  const fertDueIn =
    sinceFert == null ? 0 : plan.fertilizeFrequencyWeeks * 7 - sinceFert;

  const todayLine =
    waterDueIn <= 0
      ? sinceWater == null
        ? "No watering logged yet. Check the soil and log the first one."
        : `Water is due${waterDueIn < 0 ? ` (${Math.abs(waterDueIn)} days late, your plant noticed)` : ""}. Check soil first, then water deep.`
      : `Water in ${waterDueIn} day${waterDueIn === 1 ? "" : "s"}. Today, just check the soil with a finger.`;

  const weekItems: string[] = [];
  if (fertDueIn <= 7) {
    weekItems.push(
      sinceFert == null
        ? "First feed: start your fertilizer routine this week."
        : "Feeding is due this week."
    );
  }
  weekItems.push(plan.wateringAdjustment);

  const monthItems: string[] = [...plan.seasonalTasks];
  monthItems.push(`Prune schedule: ${plan.pruneSchedule}.`);
  if (plan.soilAdjustment) monthItems.push(plan.soilAdjustment);

  return (
    <div className="space-y-3">
      {/* Goals header with inline editing */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {goals.length > 0 ? (
            goals.map((goal) => (
              <span
                key={goal.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                  goal.id === primary?.id
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                <span aria-hidden>{goal.icon}</span>
                {goal.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">
              No goals yet. Pick some and the plan gets smarter.
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-green-700 touch-manipulation"
          onClick={() => setEditGoalsOpen(true)}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit goals
        </Button>
      </div>

      {/* 1. Today */}
      <SectionCard icon={Droplets} title="Today" tone="border-blue-100 bg-blue-50/60">
        <p className="text-sm text-gray-700">{todayLine}</p>
        <Button
          variant="outline"
          size="sm"
          className="touch-manipulation min-h-[40px]"
          onClick={onMarkWatered}
        >
          Mark watered
        </Button>
      </SectionCard>

      {/* 2. This Week */}
      <SectionCard
        icon={CalendarDays}
        title="This Week"
        tone="border-emerald-100 bg-emerald-50/50"
      >
        <TipList items={weekItems} />
        <p className="text-xs text-gray-500">
          Water every {plan.waterFrequencyDays} days · Feed every {plan.fertilizeFrequencyWeeks} weeks
        </p>
      </SectionCard>

      {/* 3. This Month */}
      <SectionCard
        icon={CalendarRange}
        title="This Month"
        tone="border-gray-200 bg-gray-50/70"
      >
        <TipList items={monthItems.slice(0, 4)} />
      </SectionCard>

      {/* 4. Prune for Growth */}
      <SectionCard
        icon={Scissors}
        title="Prune for Growth"
        tone="border-amber-100 bg-amber-50/60"
      >
        <p className="text-sm text-gray-700">{pruneGuide.when}</p>
        <p className="text-sm text-gray-700">{plan.pruningAdjustment}</p>
        {showPruneDetail && (
          <div className="space-y-3 pt-1">
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase mb-1">Cut</p>
              <TipList items={pruneGuide.whatToCut} />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase mb-1">
                Don&apos;t cut
              </p>
              <TipList items={pruneGuide.whatNotToCut} />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase mb-1">
                How much
              </p>
              <p className="text-sm text-gray-700">{pruneGuide.howMuch}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase mb-1">
                Season
              </p>
              <p className="text-sm text-gray-700">{pruneGuide.season}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase mb-1">
                What it does
              </p>
              <p className="text-sm text-gray-700">{pruneGuide.growthEffect}</p>
            </div>
            {pruneGuide.warnings.map((warning) => (
              <p
                key={warning}
                className="text-xs text-amber-900 bg-amber-100/80 rounded-lg px-3 py-2"
              >
                {warning}
              </p>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowPruneDetail((v) => !v)}
          className="text-xs font-medium text-amber-800 underline underline-offset-2 touch-manipulation"
        >
          {showPruneDetail ? "Hide the full guide" : "Show the full pruning guide"}
        </button>
      </SectionCard>

      {/* 5. Feed for Your Goal */}
      <SectionCard
        icon={Sprout}
        title="Feed for Your Goal"
        tone="border-green-100 bg-green-50/60"
      >
        <p className="text-sm text-gray-700">{plan.fertilizerAdjustment}</p>
        <p className="text-xs text-gray-500">{plan.fertilizingInstructions}</p>
      </SectionCard>

      {/* 6. Watch For */}
      <SectionCard icon={Eye} title="Watch For" tone="border-orange-100 bg-orange-50/50">
        <TipList
          items={
            plan.warnings.length > 0
              ? plan.warnings
              : ["Yellow leaves, droopy stems, or crispy tips. Plants are dramatic, catch it early."]
          }
        />
      </SectionCard>

      {/* 7. Goal Tips */}
      {plan.goalSpecificTips.length > 0 && (
        <SectionCard
          icon={Sparkles}
          title="Goal Tips"
          tone="border-indigo-100 bg-indigo-50/50"
        >
          <TipList items={plan.goalSpecificTips.slice(0, 5)} />
        </SectionCard>
      )}

      {aiPlan && (
        <div className="rounded-xl border border-violet-100 bg-violet-50/30 p-4">
          <AiCarePlanDisplay plan={aiPlan} />
        </div>
      )}

      <EditGoalsModal
        plant={plant}
        open={editGoalsOpen}
        onClose={() => setEditGoalsOpen(false)}
      />
    </div>
  );
}

import type { AICarePlanResponse } from "@/lib/types/ai";
import { AiSourceBadge } from "./ai-source-badge";
import { AiSafetyDisclaimer } from "./ai-safety-disclaimer";

export function AiCarePlanDisplay({
  plan,
  saved,
}: {
  plan: AICarePlanResponse;
  saved?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Your AI care plan</h3>
        <AiSourceBadge source={plan.source} saved={saved} />
      </div>

      {[
        { label: "Watering", value: plan.watering_schedule },
        { label: "Fertilizer", value: plan.fertilizer_schedule },
        { label: "Pruning", value: plan.pruning_schedule },
        { label: "Soil", value: plan.soil_recommendation },
      ].map((block) => (
        <div key={block.label}>
          <p className="text-xs font-medium text-gray-400 uppercase">{block.label}</p>
          <p className="text-sm text-gray-700 mt-1">{block.value}</p>
        </div>
      ))}

      {plan.goal_adjustments.length > 0 && (
        <div>
          <p className="text-xs font-medium text-green-700 uppercase mb-1">Goal adjustments</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {plan.goal_adjustments.map((g) => (
              <li key={g}>• {g}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.next_7_days.length > 0 && (
        <div className="rounded-xl bg-blue-50/80 p-3">
          <p className="text-xs font-medium text-blue-800 uppercase mb-1">Next 7 days</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {plan.next_7_days.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.next_30_days.length > 0 && (
        <div className="rounded-xl bg-emerald-50/80 p-3">
          <p className="text-xs font-medium text-emerald-800 uppercase mb-1">Next 30 days</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {plan.next_30_days.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.warning_signs.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <p className="text-xs font-medium uppercase mb-1">Watch for</p>
          {plan.warning_signs.join(" ")}
        </div>
      )}
      <AiSafetyDisclaimer compact />
    </div>
  );
}

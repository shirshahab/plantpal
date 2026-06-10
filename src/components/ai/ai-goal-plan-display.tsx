import type { AIGoalPlanResponse } from "@/lib/types/ai";
import { AiSourceBadge } from "./ai-source-badge";
import { AiSafetyDisclaimer } from "./ai-safety-disclaimer";

export function AiGoalPlanDisplay({
  plan,
  saved,
}: {
  plan: AIGoalPlanResponse;
  saved?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Goal plan</h3>
        <AiSourceBadge source={plan.source} saved={saved} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-green-50 p-3">
          <p className="text-xs text-green-700 uppercase">Your goal</p>
          <p className="font-medium text-gray-900 mt-1">{plan.primary_goal}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3">
          <p className="text-xs text-blue-700 uppercase">Current stage</p>
          <p className="font-medium text-gray-900 mt-1">{plan.current_stage}</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
        <p className="text-xs font-medium text-amber-800 uppercase">Next milestone</p>
        <p className="font-medium text-gray-900 mt-1">{plan.next_milestone.title}</p>
        <p className="text-sm text-gray-600 mt-1">{plan.next_milestone.description}</p>
        <p className="text-xs text-gray-400 mt-2">{plan.next_milestone.target_hint}</p>
      </div>

      {plan.missions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">This week&apos;s missions</p>
          <div className="space-y-2">
            {plan.missions.map((m) => (
              <div key={m.title} className="text-sm bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">{m.title}</p>
                <p className="text-gray-600 mt-0.5">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.progress_tips.length > 0 && (
        <div>
          <p className="text-xs font-medium text-green-700 uppercase mb-1">Do this next</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {plan.progress_tips.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>
      )}
      <AiSafetyDisclaimer compact />
    </div>
  );
}

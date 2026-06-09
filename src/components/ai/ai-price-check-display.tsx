import type { AIPriceCheckResponse } from "@/lib/types/ai";
import { AiSourceBadge } from "./ai-source-badge";
import { cn } from "@/lib/utils";

const VERDICT_COLORS: Record<AIPriceCheckResponse["buy_pass_verdict"], string> = {
  "Strong Buy": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Good Buy": "bg-green-50 text-green-700 border-green-200",
  Fair: "bg-amber-50 text-amber-700 border-amber-200",
  Pass: "bg-red-50 text-red-700 border-red-200",
  "Needs Inspection": "bg-blue-50 text-blue-700 border-blue-200",
};

export function AiPriceCheckDisplay({
  result,
}: {
  result: AIPriceCheckResponse;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">{result.corrected_plant_name}</h3>
        <AiSourceBadge source={result.source} />
      </div>

      <div
        className={cn(
          "inline-flex px-3 py-1 rounded-full text-sm font-medium border",
          VERDICT_COLORS[result.buy_pass_verdict]
        )}
      >
        {result.buy_pass_verdict}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Fair range</p>
          <p className="font-semibold">{result.estimated_price_range}</p>
        </div>
        <div className="rounded-xl bg-green-50 p-3">
          <p className="text-xs text-green-700">Good buy under</p>
          <p className="font-semibold">{result.good_buy_price}</p>
        </div>
        <div className="rounded-xl bg-red-50 p-3">
          <p className="text-xs text-red-700">Overpriced above</p>
          <p className="font-semibold">{result.overpriced_above}</p>
        </div>
      </div>

      {result.what_to_look_for.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">What to look for</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {result.what_to_look_for.map((x) => (
              <li key={x}>✓ {x}</li>
            ))}
          </ul>
        </div>
      )}

      {result.red_flags.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-600 uppercase mb-1">Red flags</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {result.red_flags.map((x) => (
              <li key={x}>⚠ {x}</li>
            ))}
          </ul>
        </div>
      )}

      {result.better_alternatives.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Alternatives</p>
          <p className="text-sm text-gray-700">{result.better_alternatives.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}

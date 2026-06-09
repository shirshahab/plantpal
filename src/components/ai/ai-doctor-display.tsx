import type { AIDoctorResponse } from "@/lib/types/ai";
import { AiSourceBadge } from "./ai-source-badge";

export function AiDoctorDisplay({
  report,
  saved,
}: {
  report: AIDoctorResponse;
  saved?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{report.likely_issue}</p>
          <p className="text-xs text-green-600 mt-1 capitalize">
            {report.confidence} confidence · {report.severity}
          </p>
        </div>
        <AiSourceBadge source={report.source} saved={saved} />
      </div>

      {report.possible_causes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase">Possible causes</p>
          <ul className="text-sm text-gray-700 mt-1 space-y-1">
            {report.possible_causes.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </div>
      )}

      {[
        { label: "What to do today", text: report.what_to_do_today },
        { label: "What to avoid", text: report.what_to_avoid },
        { label: "When to check back", text: report.when_to_check_back },
      ].map((block) => (
        <div key={block.label}>
          <p className="text-xs font-medium text-gray-400 uppercase">{block.label}</p>
          <p className="text-sm text-gray-700 mt-1">{block.text}</p>
        </div>
      ))}

      {report.needs_professional_help && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
          Based on your inputs, this may need a local nursery or extension office — check
          this first if things worsen quickly.
        </p>
      )}
    </div>
  );
}

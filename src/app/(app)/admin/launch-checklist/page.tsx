"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { runLaunchChecklist } from "@/lib/launch/launch-checklist";
import { isDevEnvironment } from "@/lib/dev/dev-tools";
import { isFounderModeEnabled } from "@/lib/billing/beta-unlock";

export default function LaunchChecklistPage() {
  const allowed = isDevEnvironment() || isFounderModeEnabled();
  const { ok, checks } = useMemo(() => runLaunchChecklist(), []);

  if (!allowed) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center text-gray-500">
        Launch checklist is internal only.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <PageHeader
        title="Launch checklist"
        description="App Store and Play Store readiness."
      />
      <Card padding="md">
        <p className="font-semibold text-gray-900 mb-4">
          Status: {ok ? "Ready" : "Needs attention"}
        </p>
        <ul className="space-y-3">
          {checks.map((check) => (
            <li key={check.name} className="flex gap-3 text-sm">
              <span
                className={
                  check.status === "ok"
                    ? "text-green-600"
                    : check.status === "warning"
                      ? "text-amber-600"
                      : "text-red-600"
                }
              >
                {check.status === "ok" ? "✓" : check.status === "warning" ? "!" : "✕"}
              </span>
              <div>
                <p className="font-medium text-gray-900">{check.name}</p>
                <p className="text-gray-500">{check.details}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

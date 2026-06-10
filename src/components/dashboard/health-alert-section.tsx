"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, HeartPulse } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getActiveHealthReports,
  HEALTH_REPORTS_CHANGED_EVENT,
} from "@/lib/health/report-storage";
import type { ProHealthReport } from "@/lib/types/health";

const SEVERITY_LABEL: Record<string, string> = {
  mild: "mild",
  moderate: "moderate",
  severe: "serious",
};

function rescanLabel(report: ProHealthReport): string {
  const created = new Date(report.createdAt).getTime();
  const hoursLeft = Math.round(48 - (Date.now() - created) / 3_600_000);
  if (hoursLeft <= 0) return "Rescan now to check progress.";
  return `Rescan in ${hoursLeft} hours.`;
}

/** Plant Health Alert — shown while a diagnosis report is still active. */
export function DashboardHealthAlert() {
  const [reports, setReports] = useState<ProHealthReport[]>([]);

  useEffect(() => {
    const load = () => setReports(getActiveHealthReports());
    load();
    window.addEventListener(HEALTH_REPORTS_CHANGED_EVENT, load);
    return () => window.removeEventListener(HEALTH_REPORTS_CHANGED_EVENT, load);
  }, []);

  if (reports.length === 0) return null;

  const report = reports[0];
  const severe = report.diagnosis.severity === "severe";

  return (
    <Link href={`/doctor/pro?reportId=${report.id}`} className="block">
      <Card
        padding="md"
        className={cn(
          "flex items-center gap-3 transition-colors",
          severe
            ? "bg-red-50 border-red-100 hover:bg-red-100/70"
            : "bg-amber-50 border-amber-100 hover:bg-amber-100/70"
        )}
      >
        <span
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            severe ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
          )}
        >
          <HeartPulse className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span
            className={cn(
              "block text-sm font-semibold",
              severe ? "text-red-900" : "text-amber-900"
            )}
          >
            Plant Health Alert
          </span>
          <span
            className={cn(
              "block text-xs mt-0.5",
              severe ? "text-red-700" : "text-amber-700"
            )}
          >
            {report.species} has a{" "}
            {SEVERITY_LABEL[report.diagnosis.severity] ?? report.diagnosis.severity}{" "}
            {report.diagnosis.likelyIssue.toLowerCase()} risk. {rescanLabel(report)}
            {reports.length > 1 && ` (+${reports.length - 1} more report${reports.length > 2 ? "s" : ""})`}
          </span>
        </span>
        <ArrowRight
          className={cn("w-4 h-4 shrink-0", severe ? "text-red-400" : "text-amber-400")}
        />
      </Card>
    </Link>
  );
}

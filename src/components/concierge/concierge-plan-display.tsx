"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Package,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConciergePlanData } from "@/lib/concierge/types";
import { SEVERITY_LABELS } from "@/lib/concierge/types";

const SEVERITY_STYLES = {
  mild: "bg-green-50 text-green-700 border-green-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  serious: "bg-red-50 text-red-700 border-red-200",
};

interface ConciergePlanDisplayProps {
  plan: ConciergePlanData & { title?: string };
  saved?: boolean;
  onMarkComplete?: () => void;
}

export function ConciergePlanDisplay({
  plan,
  saved,
  onMarkComplete,
}: ConciergePlanDisplayProps) {
  return (
    <div className="space-y-5">
      <Card padding="md" className="border-violet-100 bg-gradient-to-br from-violet-50/50 to-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">
              Recovery plan
            </p>
            {plan.title && (
              <p className="text-lg font-semibold text-gray-900 mt-1">{plan.title}</p>
            )}
            <p className="text-sm text-gray-700 mt-2">{plan.likely_issue}</p>
          </div>
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full border",
              SEVERITY_STYLES[plan.severity]
            )}
          >
            {SEVERITY_LABELS[plan.severity]}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {plan.source === "ai" ? "AI concierge plan" : "Preview concierge plan"} ·{" "}
          {plan.confidence} confidence
          {saved && " · Saved to account"}
        </p>
      </Card>

      <Card padding="md">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Root cause
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{plan.root_cause}</p>
      </Card>

      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-violet-600" />
          <p className="font-semibold text-gray-900">7-day action plan</p>
        </div>
        <ol className="space-y-2">
          {plan.seven_day_plan.map((action, i) => (
            <li key={action} className="flex gap-3 text-sm text-gray-700">
              <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              {action}
            </li>
          ))}
        </ol>
      </Card>

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">30-day recovery plan</p>
        <div className="space-y-3">
          {plan.weekly_plan.map((week) => (
            <Card key={week.week} padding="md">
              <p className="text-sm font-semibold text-gray-900">
                Week {week.week}: {week.title}
              </p>
              <ul className="mt-2 space-y-1.5">
                {week.actions.map((action) => (
                  <li key={action} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-violet-500 shrink-0">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <p className="font-semibold text-gray-900">What to avoid</p>
          </div>
          <ul className="space-y-1.5">
            {plan.what_to_avoid.map((item) => (
              <li key={item} className="text-sm text-gray-700 flex gap-2">
                <span className="text-amber-500 shrink-0">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-violet-600" />
            <p className="font-semibold text-gray-900">When to rescan</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{plan.when_to_rescan}</p>
        </Card>
      </div>

      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-gray-600" />
          <p className="font-semibold text-gray-900">Products & tools needed</p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {plan.products_needed.map((item) => (
            <li
              key={item}
              className="text-sm bg-gray-50 text-gray-700 px-3 py-1 rounded-full border border-gray-100"
            >
              {item}
            </li>
          ))}
        </ul>
      </Card>

      {plan.lessons.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-green-600" />
            <p className="font-semibold text-gray-900">Lessons to read</p>
          </div>
          <div className="space-y-2">
            {plan.lessons.map((lesson) => (
              <Link
                key={lesson.lessonId}
                href={`/learn/${lesson.lessonId}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-green-50/50 transition-colors touch-manipulation"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{lesson.reason}</p>
                </div>
                <Sparkles className="w-4 h-4 text-green-500 shrink-0" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {onMarkComplete && (
        <Button variant="secondary" className="w-full touch-manipulation" onClick={onMarkComplete}>
          Mark plan complete
        </Button>
      )}
    </div>
  );
}

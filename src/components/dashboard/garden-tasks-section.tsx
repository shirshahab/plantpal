"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Droplets,
  Flower2,
  HeartPulse,
  Leaf,
  Scissors,
  Shovel,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  buildGardenTaskView,
  type TaskGroupKey,
  type TaskGroupSummary,
} from "@/lib/tasks/task-summary";
import type { PlantTask, TaskGroups } from "@/lib/types/tasks";

const GROUP_ICONS: Record<TaskGroupKey, React.ElementType> = {
  recovery: HeartPulse,
  water: Droplets,
  health: Stethoscope,
  fertilize: Leaf,
  prune: Scissors,
  repot: Shovel,
  photo: Camera,
  harvest: Flower2,
  other: Sparkles,
};

const GROUP_ICON_STYLES: Record<TaskGroupKey, string> = {
  recovery: "bg-red-100 text-red-600",
  water: "bg-sky-100 text-sky-600",
  health: "bg-amber-100 text-amber-600",
  fertilize: "bg-lime-100 text-lime-700",
  prune: "bg-emerald-100 text-emerald-700",
  repot: "bg-orange-100 text-orange-600",
  photo: "bg-violet-100 text-violet-600",
  harvest: "bg-rose-100 text-rose-600",
  other: "bg-gray-100 text-gray-600",
};

function GroupRow({
  group,
  onComplete,
}: {
  group: TaskGroupSummary;
  onComplete: (task: PlantTask) => void;
}) {
  const Icon = GROUP_ICONS[group.key];
  const single = group.tasks.length === 1;

  return (
    <div className="flex items-center gap-3 p-2 -mx-1 rounded-xl hover:bg-gray-50 transition-colors">
      <Link href="/today" className="flex items-center gap-3 flex-1 min-w-0 touch-manipulation">
        <span
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            GROUP_ICON_STYLES[group.key]
          )}
        >
          <Icon className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-gray-900 leading-tight">
            {group.title}
          </span>
          <span className="block text-xs text-gray-500 mt-0.5">{group.subtitle}</span>
        </span>
      </Link>
      {single ? (
        <button
          type="button"
          onClick={() => onComplete(group.tasks[0])}
          className="shrink-0 w-9 h-9 rounded-full border-2 border-green-200 text-green-600 flex items-center justify-center hover:bg-green-600 hover:border-green-600 hover:text-white transition-colors touch-manipulation"
          aria-label={`Mark ${group.title} done`}
        >
          <Check className="w-4 h-4" />
        </button>
      ) : (
        <Link
          href="/today"
          className="shrink-0 text-gray-300 hover:text-gray-400"
          aria-label={`View ${group.title} tasks`}
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

export function DashboardGardenTasks({
  groups,
  plantCount,
  ready,
  onComplete,
}: {
  groups: TaskGroups;
  plantCount: number;
  ready: boolean;
  onComplete: (task: PlantTask) => void;
}) {
  const view = useMemo(
    () => buildGardenTaskView(groups, plantCount),
    [groups, plantCount]
  );

  if (!ready || plantCount === 0) return null;

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-900">
          Today&apos;s Garden Tasks
        </h2>
        <Link
          href="/today"
          className="text-sm text-green-600 font-medium inline-flex items-center gap-0.5"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {view.groups.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <span className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Your garden is under control.
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {view.upcoming[0]?.label
                ? `Up next: ${view.upcoming[0].label}`
                : "Nothing needs you today."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {view.groups.map((group) => (
            <GroupRow key={group.key} group={group} onComplete={onComplete} />
          ))}
        </div>
      )}

      {view.groups.length > 0 && (view.upcoming.length > 0 || view.hiddenCount > 0) && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {[
              view.upcoming.length > 0
                ? `Upcoming: ${view.upcoming.map((u) => u.label).join(" ")}`
                : null,
              view.hiddenCount > 0 ? `+${view.hiddenCount} more on Today.` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      )}
    </Card>
  );
}

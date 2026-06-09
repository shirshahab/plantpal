"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TaskCard } from "@/components/tasks/task-card";
import type { PlantTask } from "@/lib/types/tasks";

interface DashboardTopTasksProps {
  tasks: PlantTask[];
  ready: boolean;
  onComplete: (task: PlantTask) => void;
  onSkip: (task: PlantTask) => void;
  onSnooze: (task: PlantTask) => void;
}

export function DashboardTopTasks({
  tasks,
  ready,
  onComplete,
  onSkip,
  onSnooze,
}: DashboardTopTasksProps) {
  if (!ready || tasks.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-base font-semibold text-gray-900">Today&apos;s top tasks</h2>
        <Link
          href="/today"
          className="text-sm text-green-600 font-medium inline-flex items-center gap-0.5"
        >
          View all tasks <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="space-y-2">
        {tasks.slice(0, 3).map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            compact
            onComplete={onComplete}
            onSkip={onSkip}
            onSnooze={onSnooze}
          />
        ))}
      </div>
    </section>
  );
}

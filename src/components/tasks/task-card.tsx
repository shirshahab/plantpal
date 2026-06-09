"use client";

import Link from "next/link";
import {
  Check,
  Clock,
  Droplets,
  Leaf,
  ScanLine,
  SkipForward,
  Camera,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PlantTask, TaskPriority, TaskType } from "@/lib/types/tasks";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Partial<Record<TaskType, React.ElementType>> = {
  water: Droplets,
  fertilize: Leaf,
  scan: ScanLine,
  take_growth_photo: Camera,
  complete_lesson: BookOpen,
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-amber-100 text-amber-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-gray-100 text-gray-600",
};

function formatDue(dueDate: string) {
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  if (due.getTime() === today.getTime()) return "Today";
  if (due.getTime() < today.getTime()) return "Overdue";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function quickActionHref(task: PlantTask): string | null {
  if (task.taskType === "scan") return "/scanner";
  if (task.taskType === "take_growth_photo" && task.plantId) {
    return `/plants/${task.plantId}#growth`;
  }
  if (task.taskType === "complete_lesson") {
    const href = task.metadata?.href as string | undefined;
    return href ?? "/learn";
  }
  return null;
}

interface TaskCardProps {
  task: PlantTask;
  onComplete: (task: PlantTask) => void;
  onSkip: (task: PlantTask) => void;
  onSnooze: (task: PlantTask) => void;
  compact?: boolean;
}

export function TaskCard({
  task,
  onComplete,
  onSkip,
  onSnooze,
  compact = false,
}: TaskCardProps) {
  const Icon = TYPE_ICONS[task.taskType] ?? Leaf;
  const linkHref = quickActionHref(task);
  const isDone = task.status === "completed";

  return (
    <Card
      padding="md"
      className={cn(
        "border-l-4 touch-manipulation",
        task.priority === "urgent" && "border-l-red-500",
        task.priority === "high" && "border-l-amber-500",
        task.priority === "medium" && "border-l-blue-400",
        task.priority === "low" && "border-l-gray-300",
        isDone && "opacity-60"
      )}
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500">{task.plantName}</span>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md",
                PRIORITY_STYLES[task.priority]
              )}
            >
              {task.priority}
            </span>
            <span className="text-[10px] text-gray-400 capitalize">{task.taskType.replace(/_/g, " ")}</span>
          </div>
          <p className="font-medium text-gray-900 leading-snug">{task.title}</p>
          {!compact && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
          <p className="text-xs text-green-700 mt-2 bg-green-50/80 rounded-lg px-2 py-1.5 inline-block">
            {task.whyItMatters}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {formatDue(task.dueDate)}
          </div>
        </div>
      </div>

      {!isDone && (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-50">
          <Button size="sm" onClick={() => onComplete(task)}>
            <Check className="w-3.5 h-3.5" />
            Done
          </Button>
          {linkHref ? (
            <Link href={linkHref}>
              <Button size="sm" variant="secondary">
                Open
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : task.plantId ? (
            <Link href={`/plants/${task.plantId}`}>
              <Button size="sm" variant="secondary">
                View plant
              </Button>
            </Link>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => onSnooze(task)}>
            Snooze
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onSkip(task)}>
            <SkipForward className="w-3.5 h-3.5" />
            Skip
          </Button>
        </div>
      )}
    </Card>
  );
}

interface TaskSectionProps {
  title: string;
  tasks: PlantTask[];
  emptyMessage?: string;
  onComplete: (task: PlantTask) => void;
  onSkip: (task: PlantTask) => void;
  onSnooze: (task: PlantTask) => void;
}

export function TaskSection({
  title,
  tasks,
  emptyMessage,
  onComplete,
  onSkip,
  onSnooze,
}: TaskSectionProps) {
  if (tasks.length === 0 && !emptyMessage) return null;

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-3 px-0.5">
        {title}
        {tasks.length > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-400">({tasks.length})</span>
        )}
      </h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400 px-1">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              onSkip={onSkip}
              onSnooze={onSnooze}
            />
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Clock,
  ChevronRight,
  Droplets,
  Leaf,
  ScanLine,
  Camera,
  BookOpen,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { PlantTask, TaskPriority, TaskType } from "@/lib/types/tasks";
import { parseDateKey } from "@/lib/tasks/task-engine";
import { getTaskActionConfig, type CompletionSource } from "@/lib/tasks/task-validation";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Partial<Record<TaskType, React.ElementType>> = {
  water: Droplets,
  fertilize: Leaf,
  scan: ScanLine,
  inspect: ScanLine,
  weekly_check: ScanLine,
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
  const due = parseDateKey(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due.getTime() === today.getTime()) return "Today";
  if (due.getTime() < today.getTime()) return "Overdue";
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export interface CompleteTaskOptions {
  validated?: boolean;
  source?: CompletionSource;
}

interface TaskCardProps {
  task: PlantTask;
  onComplete: (task: PlantTask, options?: CompleteTaskOptions) => void;
  onSnooze: (task: PlantTask) => void;
  compact?: boolean;
}

export function TaskCard({ task, onComplete, onSnooze, compact = false }: TaskCardProps) {
  const [checkOpen, setCheckOpen] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const config = getTaskActionConfig(task);
  const Icon = TYPE_ICONS[task.taskType] ?? Leaf;
  const isDone = task.status === "completed";
  const checklist = (task.metadata?.checklist as string[] | undefined) ?? [];

  function handlePrimaryAction() {
    if (task.taskType === "weekly_check") {
      setCheckOpen(true);
      return;
    }
    if (config.href) return;
    onComplete(task, { validated: true, source: "manual_confirm" });
  }

  function finishWeeklyCheck() {
    setCheckOpen(false);
    onComplete(task, { validated: true, source: "manual_confirm" });
  }

  return (
    <>
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
              {!compact && (
                <span className="text-xs font-medium text-gray-500">{task.plantName}</span>
              )}
              {!compact && (
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md",
                    PRIORITY_STYLES[task.priority]
                  )}
                >
                  {task.priority}
                </span>
              )}
            </div>
            <p className="font-medium text-gray-900 leading-snug">{task.title}</p>
          {compact && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatDue(task.dueDate)}
            </div>
          </div>
        </div>

        {!isDone && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-50">
            {config.href ? (
              <Link href={config.href}>
                <Button size="sm">
                  {config.primaryLabel}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <Button size="sm" onClick={handlePrimaryAction}>
                {config.primaryLabel}
              </Button>
            )}

            <Button size="sm" variant="ghost" onClick={() => onSnooze(task)}>
              Snooze
            </Button>
          </div>
        )}
      </Card>

      <Modal
        open={checkOpen}
        onClose={() => setCheckOpen(false)}
        title={task.title}
        description="Work through the list. Optional items are optional. Drama is not."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCheckOpen(false)}>
              Not yet
            </Button>
            <Button onClick={finishWeeklyCheck}>Mark check done</Button>
          </>
        }
      >
        <ul className="space-y-2">
          {checklist.map((item, i) => {
            const isOptionalPhoto = /progress photo|take a photo/i.test(item);
            const photoHref =
              isOptionalPhoto && task.plantId ? `/plants/${task.plantId}#growth` : null;

            if (photoHref) {
              return (
                <li key={item}>
                  <Link
                    href={photoHref}
                    className="w-full flex items-start gap-3 text-left text-sm rounded-xl px-3 py-2.5 border border-gray-100 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="mt-0.5 w-5 h-5 rounded-md border border-dashed border-gray-300 shrink-0" />
                    <span>
                      {item}
                      <span className="block text-xs text-green-700 mt-0.5">Optional · opens plant photo</span>
                    </span>
                  </Link>
                </li>
              );
            }

            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))}
                  className={cn(
                    "w-full flex items-start gap-3 text-left text-sm rounded-xl px-3 py-2.5 border transition-colors",
                    checked[i]
                      ? "border-green-200 bg-green-50 text-green-900"
                      : "border-gray-100 bg-white text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0",
                      checked[i] ? "bg-green-600 border-green-600 text-white" : "border-gray-300"
                    )}
                  >
                    {checked[i] ? <Check className="w-3 h-3" /> : null}
                  </span>
                  {item}
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}

interface TaskSectionProps {
  title: string;
  tasks: PlantTask[];
  emptyMessage?: string;
  onComplete: (task: PlantTask, options?: CompleteTaskOptions) => void;
  onSnooze: (task: PlantTask) => void;
}

export function TaskSection({
  title,
  tasks,
  emptyMessage,
  onComplete,
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
              onSnooze={onSnooze}
            />
          ))}
        </div>
      )}
    </section>
  );
}

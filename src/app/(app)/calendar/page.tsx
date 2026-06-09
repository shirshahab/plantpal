"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Droplets, Leaf, Scissors, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { useTasks } from "@/lib/store/tasks-provider";
import { usePlants } from "@/lib/store/plants-provider";
import type { PlantTask, TaskType } from "@/lib/types/tasks";
import { cn } from "@/lib/utils";

const TYPE_DOT: Partial<Record<TaskType, string>> = {
  water: "bg-blue-500",
  fertilize: "bg-emerald-500",
  prune: "bg-amber-500",
  repot: "bg-purple-500",
  harvest: "bg-orange-500",
  scan: "bg-red-400",
  take_growth_photo: "bg-pink-400",
  inspect: "bg-gray-400",
  complete_lesson: "bg-indigo-400",
};

function monthMatrix(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function tasksForDay(allTasks: PlantTask[], day: Date): PlantTask[] {
  const key = day.toISOString().slice(0, 10);
  return allTasks.filter((t) => t.dueDate.slice(0, 10) === key);
}

export default function CalendarPage() {
  const { groups, ready } = useTasks();
  const { plants, loading: plantsLoading } = usePlants();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<Date>(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });

  const allTasks = useMemo(
    () => [
      ...groups.dueToday,
      ...groups.upcoming,
      ...groups.overdue,
      ...groups.completed,
    ],
    [groups]
  );

  const weeks = useMemo(
    () => monthMatrix(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  const selectedTasks = useMemo(
    () => tasksForDay(allTasks, selected),
    [allTasks, selected]
  );

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  if (!ready || plantsLoading) {
    return <LoadingState fullPage message="Loading calendar…" />;
  }

  if (plants.length === 0) {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <PageHeader
          title="Care Calendar"
          description="Watering, feeding, missions, and seasonal tasks"
        />
        <EmptyState
          icon="📅"
          title="Your calendar is empty"
          description="Add a plant to generate watering, feeding, and seasonal care tasks."
          actionLabel="Add Plant"
          actionHref="/plants/new"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <PageHeader
        title="Care Calendar"
        description="Watering, feeding, missions, and seasonal tasks"
      />

      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <p className="font-semibold text-gray-900">{monthLabel}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-400 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="aspect-square" />;
                const dayTasks = tasksForDay(allTasks, day);
                const isSelected = day.toDateString() === selected.toDateString();
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => setSelected(day)}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 touch-manipulation transition-colors",
                      isSelected && "bg-green-600 text-white",
                      !isSelected && isToday && "bg-green-50 text-green-700",
                      !isSelected && !isToday && "hover:bg-gray-50"
                    )}
                  >
                    <span className="text-sm font-medium">{day.getDate()}</span>
                    {dayTasks.length > 0 && (
                      <span className="flex gap-0.5">
                        {dayTasks.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              isSelected ? "bg-white/80" : TYPE_DOT[t.taskType] ?? "bg-gray-300"
                            )}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          {selected.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </h2>
        {selectedTasks.length === 0 ? (
          <p className="text-sm text-gray-400">No care tasks on this day.</p>
        ) : (
          <div className="space-y-2">
            {selectedTasks.map((task) => (
              <Card key={task.id} padding="sm" className="flex items-start gap-3">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full mt-2 shrink-0",
                    TYPE_DOT[task.taskType] ?? "bg-gray-300"
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.plantName}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card padding="md">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Legend</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <span className="flex items-center gap-2"><Droplets className="w-3.5 h-3.5 text-blue-500" /> Watering</span>
          <span className="flex items-center gap-2"><Leaf className="w-3.5 h-3.5 text-emerald-500" /> Fertilizer</span>
          <span className="flex items-center gap-2"><Scissors className="w-3.5 h-3.5 text-amber-500" /> Pruning</span>
          <span className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-green-600" /> Missions</span>
        </div>
      </Card>
    </div>
  );
}

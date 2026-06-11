"use client";

import { useState } from "react";
import { usePlants } from "@/lib/store/plants-provider";
import { useTasks } from "@/lib/store/tasks-provider";
import type { PlantTask } from "@/lib/types/tasks";

/**
 * Dev-only diagnostic for the task engine. Shows exactly which plants and
 * task sources feed the dashboard counts, so inflated "N plants" bugs are
 * visible at a glance. Never renders in production.
 */
export function TasksDebug() {
  const { plants } = usePlants();
  const { groups } = useTasks();
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  const active: PlantTask[] = [...groups.overdue, ...groups.dueToday];
  const countedPlantIds = [...new Set(active.map((t) => t.plantId).filter(Boolean))] as string[];
  const gardenLevel = active.filter((t) => !t.plantId);
  const bySource = active.reduce<Record<string, number>>((acc, t) => {
    acc[t.source] = (acc[t.source] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed bottom-24 left-2 z-[60] max-w-[300px] text-[11px] font-mono">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg bg-gray-900/90 text-amber-300 px-2.5 py-1.5 shadow-lg"
      >
        tasks: {active.length} · plants: {plants.length}
      </button>
      {open && (
        <div className="mt-1 rounded-lg bg-gray-900/95 text-gray-100 p-3 shadow-xl space-y-1.5 overflow-auto max-h-[50vh]">
          <p>
            plants in engine: <span className="text-amber-300">{plants.length}</span>
          </p>
          <p>
            plant IDs counted in active tasks:{" "}
            <span className="text-amber-300">{countedPlantIds.length}</span>
          </p>
          <ul className="pl-3 list-disc text-gray-400">
            {countedPlantIds.map((id) => {
              const plant = plants.find((p) => p.id === id);
              return (
                <li key={id}>
                  {plant ? plant.name : "STALE (not in plant list!)"} · {id.slice(0, 8)}
                </li>
              );
            })}
          </ul>
          <p>
            garden-level tasks (no plantId):{" "}
            <span className="text-amber-300">{gardenLevel.length}</span>
          </p>
          <ul className="pl-3 list-disc text-gray-400">
            {gardenLevel.map((t) => (
              <li key={t.id}>
                {t.taskType} · {t.source}
              </li>
            ))}
          </ul>
          <p>tasks by source:</p>
          <ul className="pl-3 list-disc text-gray-400">
            {Object.entries(bySource).map(([source, count]) => (
              <li key={source}>
                {source}: {count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

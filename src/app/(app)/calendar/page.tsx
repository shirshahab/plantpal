"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { useTasks } from "@/lib/store/tasks-provider";
import { usePlants } from "@/lib/store/plants-provider";
import {
  buildCareRoadmap,
  mergeRoadmapWithTasks,
  roadmapEventsForDay,
  type CareRoadmapEvent,
} from "@/lib/calendar/care-roadmap";
import { lookupZipRecord } from "@/lib/location/usda-zones";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { cn } from "@/lib/utils";

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

function iconsForDay(events: CareRoadmapEvent[]): string[] {
  const seen = new Set<string>();
  const icons: string[] = [];
  for (const e of events) {
    if (seen.has(e.type)) continue;
    seen.add(e.type);
    icons.push(e.icon);
  }
  return icons;
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

  const zip = plants[0]?.zipCode || loadUserProfile().zipCode || "91107";
  const zone = lookupZipRecord(zip).usdaZone;

  const allTasks = useMemo(
    () => [
      ...groups.dueToday,
      ...groups.upcoming,
      ...groups.overdue,
      ...groups.completed,
    ],
    [groups]
  );

  const roadmapEvents = useMemo(() => {
    if (plants.length === 0) return [];
    const projected = buildCareRoadmap({
      plants,
      city: lookupZipRecord(zip).city,
      zone,
      startDate: new Date(),
      months: 12,
    });
    return mergeRoadmapWithTasks(projected, allTasks);
  }, [plants, zip, zone, allTasks]);

  const weeks = useMemo(
    () => monthMatrix(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  const selectedEvents = useMemo(
    () => roadmapEventsForDay(roadmapEvents, selected),
    [roadmapEvents, selected]
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
        description="Your 12-month care roadmap"
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
                const dayEvents = roadmapEventsForDay(roadmapEvents, day);
                const icons = iconsForDay(dayEvents);
                const isSelected = day.toDateString() === selected.toDateString();
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => setSelected(day)}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 touch-manipulation transition-colors px-0.5",
                      isSelected && "bg-green-600 text-white",
                      !isSelected && isToday && "bg-green-50 text-green-700",
                      !isSelected && !isToday && "hover:bg-gray-50"
                    )}
                  >
                    <span className="text-sm font-medium">{day.getDate()}</span>
                    {icons.length > 0 && (
                      <span className="flex gap-px text-[9px] leading-none max-w-full overflow-hidden">
                        {icons.slice(0, 3).map((icon, i) => (
                          <span key={i} aria-hidden>
                            {icon}
                          </span>
                        ))}
                        {icons.length > 3 && (
                          <span className={isSelected ? "text-white/90" : "text-gray-400"}>+</span>
                        )}
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
        {selectedEvents.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing scheduled. Suspiciously peaceful.</p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map((event) => (
              <Card key={event.id} padding="sm" className="flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5" aria-hidden>
                  {event.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{event.plantName}</p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{event.description}</p>
                  <p className="text-[11px] text-green-700 mt-1">{event.reason}</p>
                  {event.plantId && (
                    <Link
                      href={`/plants/${event.plantId}`}
                      className="inline-block text-xs font-medium text-green-700 mt-2 hover:underline"
                    >
                      View plant →
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card padding="md">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Legend</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <span>💧 Watering</span>
          <span>🍽️ Fertilizer</span>
          <span>✂️ Pruning</span>
          <span>🔍 Weekly check</span>
          <span>🐛 Pest check</span>
          <span>📸 Progress photo</span>
        </div>
      </Card>
    </div>
  );
}

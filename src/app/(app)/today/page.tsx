"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskSection } from "@/components/tasks/task-card";
import { useTasks } from "@/lib/store/tasks-provider";
import { usePlants } from "@/lib/store/plants-provider";
import { InstallPrompt } from "@/components/mobile/install-prompt";
import { SyncStatusBadge } from "@/components/sync/sync-status-badge";

export default function TodayPage() {
  const { plants, loading: plantsLoading } = usePlants();
  const { groups, ready, completeTask, skipTask, snoozeTask } = useTasks();

  if (plantsLoading || !ready) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-lg w-1/2" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const totalPending =
    groups.dueToday.length + groups.overdue.length + groups.upcoming.length;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader
        title="Today"
        description={
          totalPending > 0
            ? `${groups.overdue.length + groups.dueToday.length} tasks need attention`
            : "You're all caught up — nice work!"
        }
        action={
          <div className="flex items-center gap-2">
            <SyncStatusBadge />
            <Link href="/calendar">
              <Button variant="secondary" size="sm">
                <CalendarDays className="w-4 h-4" />
                Calendar
              </Button>
            </Link>
          </div>
        }
      />

      <InstallPrompt />

      {plants.length === 0 ? (
        <EmptyState
          icon="🪴"
          title="Add your first plant"
          description="Your daily tasks, watering reminders, and care schedule start here."
          actionLabel="Add Plant"
          actionHref="/plants/new"
          secondaryLabel="Explore Demo"
          secondaryHref="/onboarding"
        />
      ) : (
        <>
          {groups.overdue.length > 0 && (
            <Card padding="md" className="bg-amber-50 border-amber-100">
              <p className="text-sm font-medium text-amber-800">
                {groups.overdue.length} overdue task{groups.overdue.length !== 1 ? "s" : ""} — tackle these first
              </p>
            </Card>
          )}

          <TaskSection
            title="Due today"
            tasks={groups.dueToday}
            emptyMessage="Nothing scheduled for today."
            onComplete={completeTask}
            onSkip={skipTask}
            onSnooze={snoozeTask}
          />

          <TaskSection
            title="Overdue"
            tasks={groups.overdue}
            onComplete={completeTask}
            onSkip={skipTask}
            onSnooze={snoozeTask}
          />

          <TaskSection
            title="Water today"
            tasks={groups.dueToday.filter((t) => t.taskType === "water")}
            onComplete={completeTask}
            onSkip={skipTask}
            onSnooze={snoozeTask}
          />

          <TaskSection
            title="Fertilizer soon"
            tasks={[...groups.dueToday, ...groups.upcoming].filter(
              (t) => t.taskType === "fertilize"
            )}
            onComplete={completeTask}
            onSkip={skipTask}
            onSnooze={snoozeTask}
          />

          <TaskSection
            title="Health checks"
            tasks={[...groups.dueToday, ...groups.overdue].filter(
              (t) => t.taskType === "scan" || t.taskType === "inspect"
            )}
            onComplete={completeTask}
            onSkip={skipTask}
            onSnooze={snoozeTask}
          />

          <TaskSection
            title="Active missions"
            tasks={[...groups.dueToday, ...groups.overdue].filter(
              (t) => t.source === "goal_mission" && t.metadata?.missionId
            )}
            onComplete={completeTask}
            onSkip={skipTask}
            onSnooze={snoozeTask}
          />

          <TaskSection
            title="Seasonal tasks"
            tasks={[...groups.dueToday, ...groups.upcoming].filter(
              (t) => t.source === "seasonal"
            )}
            onComplete={completeTask}
            onSkip={skipTask}
            onSnooze={snoozeTask}
          />

          <TaskSection
            title="Coming up"
            tasks={groups.upcoming.slice(0, 8)}
            onComplete={completeTask}
            onSkip={skipTask}
            onSnooze={snoozeTask}
          />

          <TaskSection
            title="Completed today"
            tasks={groups.completed.filter((t) => {
              if (!t.completedAt) return false;
              const d = new Date(t.completedAt);
              const now = new Date();
              return d.toDateString() === now.toDateString();
            })}
            emptyMessage="Complete a task to see it here."
            onComplete={completeTask}
            onSkip={skipTask}
            onSnooze={snoozeTask}
          />

          {totalPending === 0 && groups.completed.length === 0 && (
            <EmptyState
              icon="✨"
              compact
              title="You're clear today"
              description="No tasks due — enjoy your garden or check the calendar for what's coming up."
              actionLabel="View Calendar"
              actionHref="/calendar"
            />
          )}
        </>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Plus, ScanLine, Sparkles, AlertTriangle, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PlantCard } from "@/components/plant-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { InstallPrompt } from "@/components/mobile/install-prompt";
import { DemoBanner } from "@/components/demo/demo-banner";
import { usePlants } from "@/lib/store/plants-provider";
import { CareLevelCard } from "@/components/education/care-level-card";
import { GardenScoreCard } from "@/components/score/garden-score-card";
import { LocalCareCard } from "@/components/climate/local-care-card";
import { TaskCard } from "@/components/tasks/task-card";
import { useTasks } from "@/lib/store/tasks-provider";
import { useJourney } from "@/lib/store/journey-provider";
import { useEducation } from "@/lib/store/education-provider";
import { LESSONS } from "@/lib/education/lessons";
import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh";
import { useToast } from "@/lib/store/toast-provider";
import { seedDemoGarden } from "@/lib/demo/seed-demo-garden";
import { loadUserProfile } from "@/lib/profile/user-profile";

export default function DashboardPage() {
  const { plants, loading, refreshPlants } = usePlants();
  const { topTasks, completeTask, skipTask, snoozeTask, ready: tasksReady } = useTasks();
  const { getTodaysMissions } = useJourney();
  const { progress } = useEducation();
  const { toast } = useToast();
  const { refreshing, onTouchStart, onTouchEnd } = usePullToRefresh(async () => {
    await refreshPlants();
    toast("Garden refreshed");
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (plants.length === 0) {
    return (
      <div className="space-y-6" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <PageHeader title="My Garden" description="Your garden at a glance" />
        <InstallPrompt />
        <DemoBanner />
        <Card padding="lg" className="text-center border-green-100 bg-gradient-to-b from-green-50/80 to-white">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto text-3xl">
            🌱
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-4">Start your garden.</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Add your first plant to unlock daily tasks, care plans, and local climate tips.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
            <Link href="/plants/new">
              <Button size="lg" className="w-full sm:w-auto touch-manipulation">
                <Plus className="w-4 h-4" />
                Add First Plant
              </Button>
            </Link>
            <Link href="/scanner">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto touch-manipulation">
                <ScanLine className="w-4 h-4" />
                Scan Plant
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto touch-manipulation"
              onClick={() => {
                const profile = loadUserProfile();
                seedDemoGarden(profile.zipCode || "91107");
                window.location.reload();
              }}
            >
              <Sparkles className="w-4 h-4" />
              Explore Demo Garden
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const healthIssues = plants.filter(
    (p) => p.healthStatus === "needs_attention" || p.healthStatus === "critical"
  );
  const activeMission = getTodaysMissions(plants)[0];
  const nextLesson = LESSONS.find((l) => !progress.completedLessons.includes(l.id));

  return (
    <div
      className="space-y-5 md:space-y-8"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {refreshing && (
        <div className="text-center text-xs text-green-600 font-medium py-1">
          Refreshing…
        </div>
      )}

      <PageHeader
        title="My Garden"
        description="Your garden at a glance"
        action={
          <Link href="/today">
            <Button>
              View Today
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        }
      />

      <InstallPrompt />
      <DemoBanner />

      <GardenScoreCard plants={plants} />

      {tasksReady && topTasks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s top tasks</h2>
            <Link href="/today" className="text-sm text-green-600 font-medium">
              See all
            </Link>
          </div>
          <div className="space-y-3">
            {topTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                compact
                onComplete={completeTask}
                onSkip={skipTask}
                onSnooze={snoozeTask}
              />
            ))}
          </div>
        </section>
      )}

      <LocalCareCard plants={plants} />

      {activeMission && (
        <Card padding="md" className="border-green-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                Active mission
              </p>
              <p className="font-medium text-gray-900 mt-1">{activeMission.title}</p>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                {activeMission.description}
              </p>
              <Link href="/today" className="text-sm text-green-600 font-medium mt-2 inline-block">
                Complete on Today →
              </Link>
            </div>
          </div>
        </Card>
      )}

      {healthIssues.length > 0 && (
        <Card padding="md" className="border-amber-100 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold text-gray-900">Recent health issues</h2>
          </div>
          <ul className="space-y-2">
            {healthIssues.slice(0, 3).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/plants/${p.id}`}
                  className="text-sm text-gray-700 hover:text-green-700"
                >
                  {p.name} — {p.healthStatus.replace("_", " ")}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {nextLesson && (
        <Card padding="md" className="hidden md:block">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Continue learning
          </p>
          <p className="font-medium text-gray-900 mt-1">{nextLesson.title}</p>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{nextLesson.description}</p>
          <Link href={`/learn/${nextLesson.id}`} className="mt-3 inline-block">
            <Button variant="secondary" size="sm">
              Resume lesson
            </Button>
          </Link>
        </Card>
      )}

      <div className="hidden md:block">
        <CareLevelCard compact />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Your Plants</h2>
          <Link href="/plants" className="text-sm text-green-600 font-medium touch-manipulation py-2">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {plants.slice(0, 6).map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      </section>
    </div>
  );
}

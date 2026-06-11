"use client";

import { useState } from "react";
import { SafeImage } from "@/components/plants/plant-image";
import Link from "next/link";
import { ClipboardList, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CameraCapture } from "@/components/scanner/camera-capture";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { ConciergePlanDisplay } from "@/components/concierge/concierge-plan-display";
import { usePlants } from "@/lib/store/plants-provider";
import { useJourney } from "@/lib/store/journey-provider";
import { useTasks } from "@/lib/store/tasks-provider";
import { usePhotos } from "@/lib/store/photos-provider";
import { useToast } from "@/lib/store/toast-provider";
import { requestConciergePlan } from "@/lib/ai/client";
import { buildConciergeRequest } from "@/lib/ai/build-request";
import { friendlyAiError } from "@/lib/errors/user-messages";
import { planTitle } from "@/lib/concierge/mock-plan";
import { saveConciergePlan } from "@/lib/concierge/storage";
import type { ConciergePlanData, SavedConciergePlan } from "@/lib/concierge/types";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ConciergeHub() {
  const { plants } = usePlants();
  const { getPlantGoals, getPrimaryGoal } = useJourney();
  const { careLogs } = useTasks();
  const { getPhotosForPlant } = usePhotos();
  const { toast } = useToast();

  const [plantId, setPlantId] = useState(plants[0]?.id ?? "");
  const [issue, setIssue] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<(ConciergePlanData & { title?: string }) | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);

  const plant = plants.find((p) => p.id === plantId);

  async function handleFile(file: File) {
    const dataUrl = await readFileAsDataUrl(file);
    setPreview(dataUrl);
    setPlan(null);
  }

  async function handleCreatePlan() {
    if (!plant || !issue.trim()) return;
    setLoading(true);
    setError(null);

    const goals = getPlantGoals(plant.id);
    const primary = getPrimaryGoal(plant.id);
    const photos = getPhotosForPlant(plant.id);
    const healthScans = photos.filter((p) => p.photoType === "health_scan").length;
    const plantLogs = careLogs.filter((l) => l.plantId === plant.id);

    const res = await requestConciergePlan(
      buildConciergeRequest(plant, issue.trim(), goals, primary, {
        imageDataUrl: preview ?? undefined,
        tasksCompleted: plantLogs.length,
        healthScanCount: healthScans,
        careHistorySummary:
          plantLogs.length > 0
            ? `${plantLogs.length} care actions logged; last: ${plantLogs[0]?.actionType ?? "care"}`
            : undefined,
      })
    );

    setLoading(false);

    if (!res.ok) {
      setError(friendlyAiError(res.error, "Concierge"));
      return;
    }

    const data = res.data;
    setPlan(data);
    setSaved(res.saved);

    const now = new Date().toISOString();
    const localPlan: SavedConciergePlan = {
      id: crypto.randomUUID(),
      plantId: plant.id,
      title: data.title ?? planTitle(data, plant.name),
      issue: issue.trim(),
      severity: data.severity,
      plan: data,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    saveConciergePlan(localPlan);
    setSavedPlanId(localPlan.id);

    toast(
      data.source === "ai"
        ? "Recovery plan ready."
        : "Recovery plan ready (preview mode)."
    );
  }

  async function handleMarkComplete() {
    if (!savedPlanId) return;
    const plans = (await import("@/lib/concierge/storage")).loadConciergePlans();
    const existing = plans.find((p) => p.id === savedPlanId);
    if (existing) {
      saveConciergePlan({ ...existing, status: "completed", updatedAt: new Date().toISOString() });
    }
    try {
      await fetch("/api/concierge-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: savedPlanId, status: "completed" }),
      });
    } catch {
      /* local only */
    }
    toast("Plan marked complete.");
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="PlantPal Concierge"
        description="Turn a problem scan into a guided 7-day and 30-day recovery plan."
      />

      <Card padding="md" className="bg-violet-50/50 border-violet-100">
        <p className="text-sm text-gray-600">
          Concierge goes beyond diagnosis. It builds step-by-step recovery using your plant data,
          ZIP climate, goals, care history, and optional photos.
        </p>
      </Card>

      {!plants.length ? (
        <Card padding="md" className="text-center">
          <p className="text-sm text-gray-600 mb-4">Add a plant first to use Concierge.</p>
          <Link href="/plants/new">
            <Button>Add plant</Button>
          </Link>
        </Card>
      ) : (
        <FeatureGate feature="concierge">
          {!plan ? (
            <div className="space-y-6">
              <Card padding="md" className="space-y-4">
                <p className="text-sm font-semibold text-gray-900">1. Select plant</p>
                <Select
                  label="Plant"
                  value={plantId}
                  onChange={(e) => {
                    setPlantId(e.target.value);
                    setPlan(null);
                    setPreview(null);
                  }}
                  options={[
                    { value: "", label: "Choose a plant…" },
                    ...plants.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
                {plant && (
                  <div className="flex gap-3 items-center p-3 rounded-xl bg-gray-50">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <SafeImage src={plant.image} alt={plant.name} plantText={`${plant.name} ${plant.species}`} />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{plant.species}</p>
                      <p className="text-gray-500">ZIP {plant.zipCode}</p>
                    </div>
                  </div>
                )}
              </Card>

              <Card padding="md" className="space-y-4">
                <p className="text-sm font-semibold text-gray-900">2. Describe the issue</p>
                <Input
                  label="What's wrong?"
                  placeholder="Yellow leaves on new growth, sticky residue, wilting…"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                />
              </Card>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3 px-1">
                  3. Optional photo
                </p>
                <CameraCapture
                  preview={preview}
                  loading={loading}
                  loadingLabel="Building recovery plan…"
                  onFile={handleFile}
                  onClear={() => setPreview(null)}
                  emptyHint="Upload a photo of the affected area (optional)"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <Button
                className="w-full touch-manipulation"
                size="lg"
                loading={loading}
                disabled={!plantId || !issue.trim()}
                onClick={handleCreatePlan}
              >
                <ClipboardList className="w-5 h-5" />
                Create recovery plan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {plant && (
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <SafeImage src={plant.image} alt={plant.name} plantText={`${plant.name} ${plant.species}`} />
                  </div>
                  <p className="font-medium text-gray-900">{plant.name}</p>
                </div>
              )}
              <ConciergePlanDisplay
                plan={plan}
                saved={saved}
                onMarkComplete={savedPlanId ? handleMarkComplete : undefined}
              />
              <Button
                variant="secondary"
                className="w-full touch-manipulation"
                onClick={() => {
                  setPlan(null);
                  setPreview(null);
                  setSavedPlanId(null);
                }}
              >
                <Sparkles className="w-5 h-5" />
                New concierge plan
              </Button>
            </div>
          )}
        </FeatureGate>
      )}
    </div>
  );
}

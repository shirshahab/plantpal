"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CameraCapture } from "@/components/scanner/camera-capture";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { SpaceTypePicker } from "@/components/landscape/space-type-picker";
import { StyleGoalPicker } from "@/components/landscape/style-goal-picker";
import { DesignResults } from "@/components/landscape/design-results";
import { ProjectsList, ProjectsListHeader } from "@/components/landscape/projects-list";
import { requestLandscapeDesign } from "@/lib/ai/client";
import { friendlyAiError } from "@/lib/errors/user-messages";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { useToast } from "@/lib/store/toast-provider";
import type {
  BudgetRange,
  LandscapeDesignResponse,
  LandscapeProject,
  SpaceType,
  StyleGoal,
  SunExposure,
  YardSize,
} from "@/lib/landscape/types";
import {
  BUDGET_RANGE_LABELS,
  SPACE_TYPE_LABELS,
  STYLE_GOAL_LABELS,
} from "@/lib/landscape/types";
import {
  deleteLandscapeProject,
  deleteRemoteLandscapeProject,
  fetchRemoteLandscapeProjects,
  getLandscapeProject,
  loadLandscapeProjects,
  saveLandscapeProject,
  syncLandscapeProjectToRemote,
} from "@/lib/landscape/storage";

type Tab = "design" | "projects";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function LandscapeDesignerHub() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("design");
  const [spaceType, setSpaceType] = useState<SpaceType | null>(null);
  const [zipCode, setZipCode] = useState("");
  const [sunExposure, setSunExposure] = useState<SunExposure>("mixed");
  const [yardSize, setYardSize] = useState<YardSize>("unknown");
  const [budgetRange, setBudgetRange] = useState<BudgetRange>("flexible");
  const [styleGoal, setStyleGoal] = useState<StyleGoal | null>(null);
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [design, setDesign] = useState<LandscapeDesignResponse | null>(null);
  const [projects, setProjects] = useState<LandscapeProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [visualConceptRequested, setVisualConceptRequested] = useState(false);
  const [projectName, setProjectName] = useState("");

  const refreshProjects = useCallback(async () => {
    const local = loadLandscapeProjects();
    const remote = await fetchRemoteLandscapeProjects();
    if (remote.length === 0) {
      setProjects(local);
      return;
    }
    const merged = new Map<string, LandscapeProject>();
    for (const p of local) merged.set(p.id, p);
    for (const p of remote) merged.set(p.id, p);
    setProjects(
      [...merged.values()].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    );
  }, []);

  useEffect(() => {
    const profile = loadUserProfile();
    if (profile.zipCode) setZipCode(profile.zipCode);
    void refreshProjects();
  }, [refreshProjects]);

  async function handleFile(file: File) {
    const dataUrl = await readFileAsDataUrl(file);
    setPreview(dataUrl);
    setDesign(null);
    setError(null);
    setActiveProjectId(null);
    setVisualConceptRequested(false);
  }

  async function handleAnalyze() {
    if (!spaceType || !styleGoal || !preview || zipCode.trim().length < 5) return;
    setLoading(true);
    setError(null);

    const res = await requestLandscapeDesign({
      imageDataUrl: preview,
      spaceType,
      zipCode: zipCode.trim(),
      sunExposure,
      yardSize,
      budgetRange,
      styleGoal,
      notes: notes.trim() || undefined,
    });

    setLoading(false);

    if (!res.ok) {
      setError(friendlyAiError(res.error, "Landscape Designer"));
      return;
    }

    setDesign(res.data);
    setProjectName(`${STYLE_GOAL_LABELS[styleGoal]} · ${SPACE_TYPE_LABELS[spaceType]}`);
    toast(
      res.data.source === "ai"
        ? "Landscape plan ready."
        : "Landscape plan ready (demo mode)."
    );
  }

  async function handleSaveProject() {
    if (!design || !spaceType || !styleGoal || !preview) return;
    setSaving(true);

    const id = activeProjectId ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const project: LandscapeProject = {
      id,
      name: projectName.trim() || `${STYLE_GOAL_LABELS[styleGoal]} plan`,
      spaceType,
      zipCode: zipCode.trim(),
      sunExposure,
      yardSize,
      budgetRange,
      styleGoal,
      notes: notes.trim(),
      photos: [{ dataUrl: preview, label: "Primary" }],
      photoDataUrl: preview,
      design,
      visualConceptRequested,
      createdAt: activeProjectId
        ? getLandscapeProject(id)?.createdAt ?? now
        : now,
      updatedAt: now,
    };

    const localOk = saveLandscapeProject(project);
    const storage = await syncLandscapeProjectToRemote(project);
    setSaving(false);

    if (!localOk) {
      toast("Could not save locally — photo may be too large.");
      return;
    }

    setActiveProjectId(id);
    await refreshProjects();
    toast(
      storage === "supabase"
        ? "Landscape project saved to your account."
        : "Landscape project saved on this device."
    );
  }

  function handleVisualConcept() {
    setVisualConceptRequested(true);
    toast("Visual concept queued — AI mockups coming soon.");
  }

  function openProject(project: LandscapeProject) {
    setActiveProjectId(project.id);
    setSpaceType(project.spaceType);
    setZipCode(project.zipCode);
    setSunExposure(project.sunExposure);
    setYardSize(project.yardSize);
    setBudgetRange(project.budgetRange);
    setStyleGoal(project.styleGoal);
    setNotes(project.notes);
    setPreview(project.photoDataUrl);
    setDesign(project.design);
    setProjectName(project.name);
    setVisualConceptRequested(project.visualConceptRequested);
    setTab("design");
    setError(null);
  }

  async function handleDeleteProject(id: string) {
    deleteLandscapeProject(id);
    await deleteRemoteLandscapeProject(id);
    if (activeProjectId === id) setActiveProjectId(null);
    await refreshProjects();
    toast("Project deleted.");
  }

  function startNewDesign() {
    setDesign(null);
    setPreview(null);
    setActiveProjectId(null);
    setVisualConceptRequested(false);
    setError(null);
    setTab("design");
  }

  const canAnalyze =
    !!spaceType &&
    !!styleGoal &&
    !!preview &&
    /^\d{5}$/.test(zipCode.trim()) &&
    !loading;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="AI Landscape Designer"
        description="Upload yard photos — get climate-matched plans with trees, shrubs, irrigation, and budget tiers."
        action={
          tab === "projects" ? (
            <Button variant="secondary" size="sm" onClick={startNewDesign}>
              New design
            </Button>
          ) : design ? (
            <Button variant="secondary" size="sm" onClick={startNewDesign}>
              Start over
            </Button>
          ) : null
        }
      />

      <Card padding="md" className="bg-gradient-to-br from-green-50/80 to-white border-green-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">PlantPal&apos;s flagship premium feature</p>
            <p className="text-sm text-gray-600 mt-1">
              Analyze your space by ZIP, climate, style goal, and budget. Save full projects for
              inspiration, photos, plant lists, and estimates.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          onClick={() => setTab("design")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors touch-manipulation ${
            tab === "design"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          New design
        </button>
        <button
          type="button"
          onClick={() => {
            void refreshProjects();
            setTab("projects");
          }}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors touch-manipulation ${
            tab === "projects"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          My projects ({projects.length})
        </button>
      </div>

      {tab === "projects" ? (
        <div className="space-y-4">
          <ProjectsListHeader count={projects.length} />
          <ProjectsList
            projects={projects}
            onOpen={(id) => {
              const p = projects.find((x) => x.id === id);
              if (p) openProject(p);
            }}
            onDelete={handleDeleteProject}
          />
        </div>
      ) : (
        <FeatureGate feature="landscape_designer">
          {!design ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">1. Choose your space</p>
                <SpaceTypePicker value={spaceType} onChange={setSpaceType} />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">2. Upload a photo</p>
                <CameraCapture
                  preview={preview}
                  loading={loading}
                  loadingLabel="Analyzing your space…"
                  onFile={handleFile}
                  onClear={() => {
                    setPreview(null);
                    setDesign(null);
                  }}
                  emptyHint="Front yard, backyard, patio, balcony, slope, or garden area"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">3. Style goal</p>
                <StyleGoalPicker value={styleGoal} onChange={setStyleGoal} />
              </div>

              <Card padding="md" className="space-y-4">
                <p className="text-sm font-semibold text-gray-900">4. Site details</p>
                <Input
                  label="ZIP code"
                  placeholder="91107"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  maxLength={5}
                />
                <Select
                  label="Sun exposure"
                  value={sunExposure}
                  onChange={(e) => setSunExposure(e.target.value as SunExposure)}
                  options={[
                    { value: "full_sun", label: "Full sun (6+ hrs)" },
                    { value: "partial_sun", label: "Partial sun" },
                    { value: "shade", label: "Mostly shade" },
                    { value: "mixed", label: "Mixed / varies" },
                  ]}
                />
                <Select
                  label="Yard size"
                  value={yardSize}
                  onChange={(e) => setYardSize(e.target.value as YardSize)}
                  options={[
                    { value: "unknown", label: "Not sure — estimate from photo" },
                    { value: "small", label: "Small (under 500 sq ft)" },
                    { value: "medium", label: "Medium (500–2,000 sq ft)" },
                    { value: "large", label: "Large (2,000+ sq ft)" },
                  ]}
                />
                <Select
                  label="Budget range"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value as BudgetRange)}
                  options={Object.entries(BUDGET_RANGE_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
                <Input
                  label="Notes (optional)"
                  placeholder="Existing irrigation, HOA rules, pets, access constraints…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
                <Button
                  className="w-full touch-manipulation"
                  size="lg"
                  loading={loading}
                  disabled={!canAnalyze}
                  onClick={handleAnalyze}
                >
                  <Wand2 className="w-5 h-5" />
                  Analyze & generate plan
                </Button>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Project title"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              <DesignResults
                design={design}
                photoPreview={preview}
                onSave={handleSaveProject}
                onVisualConcept={handleVisualConcept}
                saving={saving}
                visualConceptRequested={visualConceptRequested}
              />
            </div>
          )}
        </FeatureGate>
      )}
    </div>
  );
}

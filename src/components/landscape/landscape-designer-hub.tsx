"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CameraCapture } from "@/components/scanner/camera-capture";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { StyleGoalPicker } from "@/components/landscape/style-goal-picker";
import { DesignResults } from "@/components/landscape/design-results";
import { ProjectsList, ProjectsListHeader } from "@/components/landscape/projects-list";
import { requestLandscapeDesign } from "@/lib/ai/client";
import { friendlyAiError } from "@/lib/errors/user-messages";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { useToast } from "@/lib/store/toast-provider";
import { STYLE_GOAL_LABELS } from "@/lib/landscape/types";
import type {
  LandscapeDesignResponse,
  LandscapeProject,
  SpaceType,
  StyleGoal,
  SunExposure,
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
import { normalizeGardenStyle } from "@/lib/landscape/garden-styles";

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
  const [styleGoal, setStyleGoal] = useState<StyleGoal | null>(null);
  const [zipCode, setZipCode] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [design, setDesign] = useState<LandscapeDesignResponse | null>(null);
  const [projects, setProjects] = useState<LandscapeProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
  }

  async function handleGenerate() {
    if (!styleGoal || !preview || zipCode.trim().length < 5) return;
    setLoading(true);
    setError(null);

    const res = await requestLandscapeDesign({
      imageDataUrl: preview,
      spaceType: "back_yard" as SpaceType,
      zipCode: zipCode.trim(),
      sunExposure: "mixed" as SunExposure,
      yardSize: "unknown",
      budgetRange: "flexible",
      styleGoal,
    });

    setLoading(false);

    if (!res.ok) {
      setError(friendlyAiError(res.error, "Garden Designer"));
      return;
    }

    setDesign(res.data);
    setProjectName(`${STYLE_GOAL_LABELS[styleGoal]} yard design`);
    toast(
      res.data.source === "ai"
        ? "Your garden design is ready."
        : "Your garden design is ready (preview mode)."
    );
  }

  async function handleSaveProject() {
    if (!design || !styleGoal || !preview) return;
    setSaving(true);

    const id = activeProjectId ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const project: LandscapeProject = {
      id,
      name: projectName.trim() || `${STYLE_GOAL_LABELS[styleGoal]} design`,
      spaceType: "back_yard",
      zipCode: zipCode.trim(),
      sunExposure: "mixed",
      yardSize: "unknown",
      budgetRange: "flexible",
      styleGoal,
      notes: "",
      photos: [{ dataUrl: preview, label: "Before" }],
      photoDataUrl: preview,
      design,
      visualConceptRequested: false,
      createdAt: activeProjectId
        ? getLandscapeProject(id)?.createdAt ?? now
        : now,
      updatedAt: now,
    };

    const localOk = saveLandscapeProject(project);
    const storage = await syncLandscapeProjectToRemote(project);
    setSaving(false);

    if (!localOk) {
      toast("Could not save locally. Photo may be too large.");
      return;
    }

    setActiveProjectId(id);
    await refreshProjects();
    toast(
      storage === "supabase"
        ? "Design saved to your PlantPal account."
        : "Design saved on this device."
    );
  }

  function openProject(project: LandscapeProject) {
    setActiveProjectId(project.id);
    setStyleGoal(normalizeGardenStyle(project.styleGoal));
    setZipCode(project.zipCode);
    setPreview(project.photoDataUrl);
    setDesign(project.design);
    setProjectName(project.name);
    setTab("design");
    setError(null);
  }

  async function handleDeleteProject(id: string) {
    deleteLandscapeProject(id);
    await deleteRemoteLandscapeProject(id);
    if (activeProjectId === id) setActiveProjectId(null);
    await refreshProjects();
    toast("Design deleted.");
  }

  function startNewDesign() {
    setDesign(null);
    setPreview(null);
    setStyleGoal(null);
    setActiveProjectId(null);
    setError(null);
    setTab("design");
  }

  const canGenerate =
    !!styleGoal && !!preview && /^\d{5}$/.test(zipCode.trim()) && !loading;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Garden Designer"
        description="Upload a yard photo, pick a garden style, and get a before/after concept with plant list and cost estimate."
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
            <p className="font-medium text-gray-900">Six garden styles</p>
            <p className="text-sm text-gray-600 mt-1">
              Modern · Japanese · Cottage · Tropical · Desert · Edible garden. Each with plants,
              maintenance level, and estimated cost for your ZIP code.
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
          Saved designs ({projects.length})
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
                <p className="text-sm font-semibold text-gray-900 mb-3">1. Upload yard photo</p>
                <CameraCapture
                  preview={preview}
                  loading={loading}
                  loadingLabel="Designing your garden…"
                  onFile={handleFile}
                  onClear={() => {
                    setPreview(null);
                    setDesign(null);
                  }}
                  emptyHint="Front yard, backyard, patio, or garden area"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">2. Choose garden style</p>
                <StyleGoalPicker value={styleGoal} onChange={setStyleGoal} />
              </div>

              <Card padding="md" className="space-y-4">
                <p className="text-sm font-semibold text-gray-900">3. Location & generate</p>
                <Input
                  label="ZIP code (for climate-matched plants)"
                  placeholder="e.g. 91107"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  maxLength={5}
                />
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
                <Button
                  className="w-full touch-manipulation"
                  size="lg"
                  loading={loading}
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                >
                  <Wand2 className="w-5 h-5" />
                  Generate {styleGoal ? STYLE_GOAL_LABELS[styleGoal] : "garden"} design
                </Button>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Design name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              {styleGoal && (
                <DesignResults
                  design={design}
                  styleGoal={styleGoal}
                  photoPreview={preview}
                  onSave={handleSaveProject}
                  saving={saving}
                />
              )}
            </div>
          )}
        </FeatureGate>
      )}
    </div>
  );
}

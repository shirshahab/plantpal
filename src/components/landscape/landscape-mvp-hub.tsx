"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { StyleGoalPicker } from "@/components/landscape/style-goal-picker";
import { LandscapeResultsMvp } from "@/components/landscape/landscape-results-mvp";
import { ProjectsList, ProjectsListHeader } from "@/components/landscape/projects-list";
import { requestLandscapeDesign } from "@/lib/ai/client";
import { friendlyAiError } from "@/lib/errors/user-messages";
import {
  defaultPropertyProfile,
  fetchPropertyProfileRemote,
  loadPropertyProfile,
  savePropertyProfile,
  syncPropertyProfileRemote,
} from "@/lib/landscape/property-profile";
import { uploadLandscapePhoto } from "@/lib/landscape/photo-upload";
import {
  BUDGET_MVP_LABELS,
  BUDGET_MVP_SYMBOLS,
  MAINTENANCE_PREF_LABELS,
  SPACE_TYPE_LABELS,
  STYLE_GOAL_LABELS,
  SUN_EXPOSURE_LABELS,
  YARD_PHOTO_SLOTS,
  YARD_SIZE_LABELS,
  budgetMvpToRange,
  type LandscapeDesignResponse,
  type LandscapeProject,
  type LandscapeProjectPhoto,
  type LandscapePropertyProfile,
  type SpaceType,
  type StyleGoal,
} from "@/lib/landscape/types";
import { lookupZipRecord } from "@/lib/location/usda-zones";
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
import { useToast } from "@/lib/store/toast-provider";
import { cn } from "@/lib/utils";

type Tab = "design" | "projects";
type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1 as Step, label: "Property" },
  { n: 2 as Step, label: "Photos" },
  { n: 3 as Step, label: "Style" },
  { n: 4 as Step, label: "Design" },
];

export function LandscapeMvpHub() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("design");
  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<LandscapePropertyProfile>(() => loadPropertyProfile());
  const [photos, setPhotos] = useState<Record<SpaceType, LandscapeProjectPhoto | null>>({
    front_yard: null,
    back_yard: null,
    side_yard: null,
    patio: null,
    balcony: null,
    slope: null,
  });
  const [activeSpace, setActiveSpace] = useState<SpaceType>("back_yard");
  const [styleGoal, setStyleGoal] = useState<StyleGoal | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [design, setDesign] = useState<LandscapeDesignResponse | null>(null);
  const [projects, setProjects] = useState<LandscapeProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState("");

  const refreshProjects = useCallback(async () => {
    const local = loadLandscapeProjects();
    const remote = await fetchRemoteLandscapeProjects();
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
    void refreshProjects();
    void fetchPropertyProfileRemote().then((remote) => {
      if (remote) {
        setProfile(remote);
        savePropertyProfile(remote);
      }
    });
  }, [refreshProjects]);

  function updateProfile(patch: Partial<LandscapePropertyProfile>) {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      if (patch.zipCode?.length === 5) {
        const record = lookupZipRecord(patch.zipCode);
        next.hardinessZone = record.usdaZone;
      }
      savePropertyProfile(next);
      void syncPropertyProfileRemote(next);
      return next;
    });
  }

  async function handlePhotoUpload(slot: SpaceType, file: File) {
    setUploading(slot);
    try {
      const { storageUrl, dataUrl } = await uploadLandscapePhoto(
        file,
        slot as "front_yard" | "back_yard" | "side_yard"
      );
      setPhotos((prev) => ({
        ...prev,
        [slot]: {
          dataUrl,
          storageUrl: storageUrl ?? undefined,
          label: SPACE_TYPE_LABELS[slot],
        },
      }));
      if (!photos[activeSpace]) setActiveSpace(slot);
    } finally {
      setUploading(null);
    }
  }

  const primaryPhoto =
    photos[activeSpace] ?? photos.back_yard ?? photos.front_yard ?? photos.side_yard;

  const photoList = YARD_PHOTO_SLOTS.map((s) => photos[s.id]).filter(
    (p): p is LandscapeProjectPhoto => !!p
  );

  /** Persist the last run so /debug/landscape can show what happened. */
  function writeDebugRecord(record: Record<string, unknown>) {
    try {
      localStorage.setItem(
        "plantpal-landscape-debug",
        JSON.stringify({ ...record, at: new Date().toISOString() })
      );
    } catch {
      /* ignore */
    }
  }

  async function persistProject(
    designResult: LandscapeDesignResponse,
    goal: StyleGoal,
    name: string
  ): Promise<{ id: string; localOk: boolean; remoteOk: boolean }> {
    const id = activeProjectId ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const project: LandscapeProject = {
      id,
      name: name.trim() || `${STYLE_GOAL_LABELS[goal]} design`,
      spaceType: activeSpace,
      zipCode: profile.zipCode,
      sunExposure: profile.sunExposure,
      yardSize: profile.yardSize,
      budgetRange: budgetMvpToRange(profile.budgetTier),
      budgetTier: profile.budgetTier,
      maintenancePreference: profile.maintenancePreference,
      styleGoal: goal,
      notes: "",
      photos: photoList.length
        ? photoList
        : primaryPhoto
          ? [{ dataUrl: primaryPhoto.dataUrl, label: "Primary" }]
          : [],
      photoDataUrl: primaryPhoto?.storageUrl ?? primaryPhoto?.dataUrl ?? "",
      design: designResult,
      visualConceptRequested: !!designResult.after_image_url,
      createdAt: activeProjectId ? getLandscapeProject(id)?.createdAt ?? now : now,
      updatedAt: now,
    };

    const localOk = saveLandscapeProject(project);
    const remoteStorage = await syncLandscapeProjectToRemote(project);
    setActiveProjectId(id);
    await refreshProjects();
    return { id, localOk, remoteOk: remoteStorage === "supabase" };
  }

  async function handleGenerate() {
    if (!styleGoal || !primaryPhoto || profile.zipCode.length < 5) return;
    setLoading(true);
    setError(null);
    setStep(4);

    const additionalPhotos = photoList.filter((p) => p.dataUrl !== primaryPhoto.dataUrl);
    const payloadKb = Math.round(
      (primaryPhoto.dataUrl.length +
        additionalPhotos.reduce((s, p) => s + p.dataUrl.length, 0)) /
        1024
    );
    console.info("[garden-designer] generate", { payloadKb, styleGoal, space: activeSpace });

    const res = await requestLandscapeDesign({
      imageDataUrl: primaryPhoto.dataUrl,
      additionalPhotos,
      spaceType: activeSpace,
      zipCode: profile.zipCode,
      sunExposure: profile.sunExposure,
      yardSize: profile.yardSize,
      budgetRange: budgetMvpToRange(profile.budgetTier),
      styleGoal,
      maintenancePreference: profile.maintenancePreference,
      generateConceptImage: true,
    });

    setLoading(false);

    if (!res.ok) {
      console.error("[garden-designer] generate failed:", res.error);
      writeDebugRecord({ ok: false, payloadKb, error: res.error });
      setError(friendlyAiError(res.error, "Garden Designer"));
      // Send the user back to the style step so the error and retry
      // button are visible — never leave step 4 blank.
      setStep(3);
      return;
    }

    console.info("[garden-designer] generate ok", { source: res.data.source });
    setDesign(res.data);
    const name = `${STYLE_GOAL_LABELS[styleGoal]} — ${SPACE_TYPE_LABELS[activeSpace]}`;
    setProjectName(name);

    // Auto-save so the design is never lost, even if the user navigates away.
    const saveResult = await persistProject(res.data, styleGoal, name);
    writeDebugRecord({
      ok: true,
      payloadKb,
      source: res.data.source,
      savedLocal: saveResult.localOk,
      savedRemote: saveResult.remoteOk,
    });
    console.info("[garden-designer] saved", saveResult);

    toast(
      saveResult.localOk || saveResult.remoteOk
        ? "Design ready — saved to your projects."
        : "Design ready. Tap Save to keep it."
    );
  }

  async function handleSaveProject() {
    if (!design || !styleGoal || !primaryPhoto) return;
    setSaving(true);
    const { localOk, remoteOk } = await persistProject(design, styleGoal, projectName);
    setSaving(false);

    if (!localOk && !remoteOk) {
      toast("Could not save — photos may be too large.");
      return;
    }
    toast("Garden design saved.");
  }

  function startNew() {
    setDesign(null);
    setStyleGoal(null);
    setStep(1);
    setError(null);
    setActiveProjectId(null);
    setTab("design");
  }

  const canProceedStep1 = /^\d{5}$/.test(profile.zipCode);
  const canProceedStep2 = !!primaryPhoto;
  const canGenerate = !!styleGoal && canProceedStep2 && canProceedStep1;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-6">
      <PageHeader
        title="Garden Designer"
        description="Upload your yard, pick a style, and get a concept design with plant list and phased plan."
        action={
          design || tab === "projects" ? (
            <Button variant="secondary" size="sm" onClick={startNew}>
              New project
            </Button>
          ) : null
        }
      />

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {(["design", "projects"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              if (t === "projects") void refreshProjects();
              setTab(t);
            }}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors touch-manipulation",
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
            )}
          >
            {t === "design" ? "New design" : `Saved (${projects.length})`}
          </button>
        ))}
      </div>

      {tab === "projects" ? (
        <div className="space-y-4">
          <ProjectsListHeader count={projects.length} />
          <ProjectsList
            projects={projects}
            onOpen={(id) => {
              const p = projects.find((x) => x.id === id);
              if (!p) return;
              setActiveProjectId(p.id);
              setProfile({
                ...profile,
                zipCode: p.zipCode,
                sunExposure: p.sunExposure,
                yardSize: p.yardSize,
                budgetTier: p.budgetTier ?? profile.budgetTier,
                maintenancePreference: p.maintenancePreference ?? profile.maintenancePreference,
              });
              setStyleGoal(normalizeGardenStyle(p.styleGoal));
              setActiveSpace(p.spaceType);
              setDesign(p.design);
              setProjectName(p.name);
              setStep(4);
              setTab("design");
            }}
            onDelete={async (id) => {
              deleteLandscapeProject(id);
              await deleteRemoteLandscapeProject(id);
              await refreshProjects();
              toast("Project deleted.");
            }}
            onStartDesign={() => {
              startNew();
              setTab("design");
            }}
          />
        </div>
      ) : (
        <FeatureGate feature="landscape_designer">
          {!design ? (
            <>
              <div className="flex gap-1 mb-2">
                {STEPS.map((s) => (
                  <div
                    key={s.n}
                    className={cn(
                      "flex-1 text-center py-2 rounded-lg text-xs font-medium",
                      step === s.n ? "bg-green-100 text-green-800" : "text-gray-400"
                    )}
                  >
                    {s.label}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <Card padding="md" className="space-y-5">
                  <p className="font-semibold text-gray-900">Step 1 — Property profile</p>
                  <Input
                    label="ZIP code"
                    value={profile.zipCode}
                    onChange={(e) =>
                      updateProfile({ zipCode: e.target.value.replace(/\D/g, "").slice(0, 5) })
                    }
                    maxLength={5}
                  />
                  {profile.hardinessZone && (
                    <p className="text-sm text-green-700 font-medium">
                      USDA Zone {profile.hardinessZone}
                    </p>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Sun exposure</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(SUN_EXPOSURE_LABELS) as Array<typeof profile.sunExposure>).map(
                        (id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => updateProfile({ sunExposure: id })}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-xs text-left touch-manipulation",
                              profile.sunExposure === id
                                ? "border-green-500 bg-green-50"
                                : "border-gray-100"
                            )}
                          >
                            {SUN_EXPOSURE_LABELS[id]}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Yard size</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(YARD_SIZE_LABELS) as Array<typeof profile.yardSize>).map(
                        (id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => updateProfile({ yardSize: id })}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-xs text-left touch-manipulation",
                              profile.yardSize === id
                                ? "border-green-500 bg-green-50"
                                : "border-gray-100"
                            )}
                          >
                            {YARD_SIZE_LABELS[id]}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Budget</p>
                    <div className="grid grid-cols-4 gap-2">
                      {(Object.keys(BUDGET_MVP_LABELS) as Array<typeof profile.budgetTier>).map(
                        (id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => updateProfile({ budgetTier: id })}
                            className={cn(
                              "rounded-xl border py-3 text-center touch-manipulation",
                              profile.budgetTier === id
                                ? "border-green-500 bg-green-50"
                                : "border-gray-100"
                            )}
                          >
                            <span className="text-lg font-bold block">
                              {BUDGET_MVP_SYMBOLS[id]}
                            </span>
                            <span className="text-[9px] text-gray-500 leading-tight block mt-1 px-1">
                              {BUDGET_MVP_LABELS[id].split(" — ")[1]}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Maintenance preference</p>
                    <div className="flex gap-2">
                      {(Object.keys(MAINTENANCE_PREF_LABELS) as Array<
                        typeof profile.maintenancePreference
                      >).map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => updateProfile({ maintenancePreference: id })}
                          className={cn(
                            "flex-1 rounded-xl border py-2.5 text-sm font-medium touch-manipulation",
                            profile.maintenancePreference === id
                              ? "border-green-500 bg-green-50 text-green-800"
                              : "border-gray-100 text-gray-600"
                          )}
                        >
                          {MAINTENANCE_PREF_LABELS[id]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full touch-manipulation"
                    disabled={!canProceedStep1}
                    onClick={() => setStep(2)}
                  >
                    Continue to photos <ChevronRight className="w-4 h-4" />
                  </Button>
                </Card>
              )}

              {step === 2 && (
                <Card padding="md" className="space-y-4">
                  <p className="font-semibold text-gray-900">Step 2 — Upload yard photos</p>
                  <p className="text-sm text-gray-500">
                    Front yard, backyard, and side yard. Photos sync to your account when signed in.
                  </p>
                  <div className="space-y-4">
                    {YARD_PHOTO_SLOTS.map((slot) => {
                      const photo = photos[slot.id];
                      return (
                        <div key={slot.id} className="rounded-xl border border-gray-100 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900">{slot.label}</p>
                            {photo && (
                              <button
                                type="button"
                                className="text-xs text-green-600"
                                onClick={() => {
                                  setActiveSpace(slot.id);
                                  setPhotos((prev) => ({ ...prev, [slot.id]: photo }));
                                }}
                              >
                                Use as primary
                              </button>
                            )}
                          </div>
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo.storageUrl ?? photo.dataUrl}
                              alt={slot.label}
                              className="w-full h-40 object-cover rounded-lg"
                            />
                          ) : (
                            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-green-300 touch-manipulation">
                              <span className="text-sm text-gray-500">
                                {uploading === slot.id ? "Uploading…" : "Tap to upload"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) void handlePhotoUpload(slot.id, f);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button
                      className="flex-1 touch-manipulation"
                      disabled={!canProceedStep2}
                      onClick={() => setStep(3)}
                    >
                      Choose style <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <Card padding="md">
                    <p className="font-semibold text-gray-900 mb-3">Step 3 — Design style</p>
                    <StyleGoalPicker value={styleGoal} onChange={setStyleGoal} />
                  </Card>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button
                      className="flex-1 touch-manipulation"
                      size="lg"
                      loading={loading}
                      disabled={!canGenerate}
                      onClick={() => void handleGenerate()}
                    >
                      <Wand2 className="w-5 h-5" />
                      Generate design
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && loading && (
                <Card padding="md" className="text-center py-12">
                  <p className="text-green-700 font-medium">Designing your garden…</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Analyzing photos, building plant list, generating concept render…
                  </p>
                </Card>
              )}

              {/* Safety net: never show a blank Design step. */}
              {step === 4 && !loading && (
                <Card padding="md" className="text-center py-10 space-y-4">
                  <p className="font-medium text-gray-900">
                    {error ? "We couldn't finish your design." : "Your design isn't ready yet."}
                  </p>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                  )}
                  <Button onClick={() => void handleGenerate()} disabled={!canGenerate}>
                    <Wand2 className="w-4 h-4" />
                    Try again
                  </Button>
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ChevronLeft className="w-4 h-4" /> Back to style
                  </Button>
                </Card>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <Input
                label="Project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              {styleGoal && (
                <LandscapeResultsMvp
                  design={design}
                  styleGoal={styleGoal}
                  beforeUrl={primaryPhoto?.storageUrl ?? primaryPhoto?.dataUrl}
                  onSave={() => void handleSaveProject()}
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

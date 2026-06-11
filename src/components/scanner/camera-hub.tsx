"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Leaf,
  Stethoscope,
  Tag,
  TrendingUp,
  Sparkles,
  Plus,
  BookOpen,
  Camera,
  ImagePlus,
  Lightbulb,
  PencilLine,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CameraCapture, fileToDataUrl } from "@/components/scanner/camera-capture";
import {
  photosToRequest,
  type CapturedPhoto,
} from "@/components/scanner/multi-photo-capture";
import { LiveCameraScanner } from "@/components/scanner/live-camera-scanner";
import { IdentifyPlantResults } from "@/components/scanner/identify-plant-results";
import { BadPhotoGuidance } from "@/components/scanner/bad-photo-guidance";
import {
  requestIdentifyPlant,
  requestScanTag,
  requestAnalyzePhoto,
} from "@/lib/ai/client";
import type {
  AIPhotoAnalyzeResponse,
  PlantIdentificationResponse,
  TagScanResponse,
  PhotoQualityAssessment,
} from "@/lib/types/ai";
import { assessPhotoQualityClient } from "@/lib/scanner/photo-quality";
import {
  saveScanToHistory,
  getScanHistory,
  SCAN_HISTORY_QUOTA_MESSAGE,
} from "@/lib/scanner/scan-history";
import { usePlants } from "@/lib/store/plants-provider";
import { usePhotos } from "@/lib/store/photos-provider";
import { useEngagement } from "@/lib/store/engagement-provider";
import { useToast } from "@/lib/store/toast-provider";
import { friendlyAiError, friendlySaveError } from "@/lib/errors/user-messages";
import { reportFeatureFailure } from "@/lib/errors/report-error";
import { trackEvent } from "@/lib/analytics/track";
import { recordScanUsage } from "@/lib/billing/usage-tracking";
import { useSubscription } from "@/lib/store/subscription-provider";
import { useUpgradeModal } from "@/components/billing/upgrade-modal-provider";
import { UPGRADE_COPY } from "@/lib/subscription/types";
import { isScannerDebugUI } from "@/lib/dev/dev-tools";
import { ScannerDebugErrorPanel } from "@/components/scanner/scanner-debug-error";
import type { IdentifyDebugLog } from "@/lib/ai/identify-errors";
import { SYMPTOM_CHIPS } from "@/lib/scanner/symptom-chips";
import {
  getDiseaseReference,
  matchSymptomsToIssues,
} from "@/lib/intelligence/disease-intelligence";
import { publishActivityEvent } from "@/lib/social/events";
import { Planty } from "@/components/brand/planty";
import { RequestExpertReview } from "@/components/health/request-expert-review";
import { validatePhotoPayload } from "@/lib/scanner/upload-limits";
import { cn } from "@/lib/utils";

type TabId = "identify" | "diagnose" | "tag" | "progress";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "identify", label: "Identify", icon: Leaf },
  { id: "diagnose", label: "Diagnose", icon: Stethoscope },
  { id: "tag", label: "Tag", icon: Tag },
  { id: "progress", label: "Progress", icon: TrendingUp },
];

const TAG_PREFILL_KEY = "plantpal-tag-prefill";

export function CameraHub() {
  const [tab, setTab] = useState<TabId>("identify");
  const [identifyPhotos, setIdentifyPhotos] = useState<CapturedPhoto[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientPhotoQuality, setClientPhotoQuality] = useState<PhotoQualityAssessment | null>(
    null
  );
  const [scanHistoryId, setScanHistoryId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanFailureStep, setScanFailureStep] = useState<string | null>(null);
  const [scanDebug, setScanDebug] = useState<IdentifyDebugLog | null>(null);
  /** User-facing failure message shown inline with a retry button. */
  const [actionError, setActionError] = useState<string | null>(null);
  const debugUI = isScannerDebugUI();

  const [identifyResult, setIdentifyResult] = useState<PlantIdentificationResponse | null>(null);
  const [diagnoseResult, setDiagnoseResult] = useState<AIPhotoAnalyzeResponse | null>(null);
  const [tagResult, setTagResult] = useState<TagScanResponse | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);

  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");

  // Diagnose tab: problem description, symptom chips, and extra photo angles.
  const [problemDescription, setProblemDescription] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const extraPhotoInputRef = useRef<HTMLInputElement>(null);

  const { plants, markCareAction } = usePlants();
  const { addPhoto } = usePhotos();
  const { addGrowthEntry, recordScan } = useEngagement();
  const { toast } = useToast();
  const { canScan, scansRemaining, scanLimit, scansUsed, betaUnlockAll } = useSubscription();
  const { showUpgradeModal } = useUpgradeModal();

  // Live reference hints from the disease library while the user describes
  // the problem. Hints only; the AI scan makes the actual diagnosis.
  const symptomHints = useMemo(() => {
    if (selectedSymptoms.length === 0 && problemDescription.trim().length < 8) return [];
    return matchSymptomsToIssues(selectedSymptoms, problemDescription, 2);
  }, [selectedSymptoms, problemDescription]);

  // Reference entry for the diagnosed issue, when our library knows it.
  const diagnosisReference = useMemo(() => {
    if (!diagnoseResult) return null;
    return (
      getDiseaseReference(diagnoseResult.issue_detected) ??
      diagnoseResult.likely_causes
        .map((c) => getDiseaseReference(c))
        .find((ref) => ref !== null) ??
      null
    );
  }, [diagnoseResult]);

  const selectedPlant = plants.find((p) => p.id === selectedPlantId);
  const identifyPreview =
    identifyPhotos.find((p) => p.role === "whole")?.dataUrl ??
    identifyPhotos[0]?.dataUrl ??
    null;

  function resetResults() {
    setIdentifyResult(null);
    setDiagnoseResult(null);
    setTagResult(null);
    setProgressSaved(false);
    setClientPhotoQuality(null);
    setScanHistoryId(null);
    setScanError(null);
    setScanFailureStep(null);
    setScanDebug(null);
    setActionError(null);
  }

  async function handleIdentifyPhotosChange(photos: CapturedPhoto[]) {
    setIdentifyPhotos(photos);
    resetResults();
    if (photos.length > 0) {
      const primary = photos.find((p) => p.role === "whole") ?? photos[0];
      const quality = await assessPhotoQualityClient(primary.dataUrl);
      setClientPhotoQuality(quality);
    } else {
      setClientPhotoQuality(null);
    }
  }

  async function handleFile(f: File) {
    setFile(f);
    const url = await fileToDataUrl(f);
    setPreview(url);
    resetResults();
  }

  function clearCapture() {
    setPreview(null);
    setFile(null);
    setExtraPhotos([]);
    resetResults();
  }

  function toggleSymptom(chip: string) {
    setSelectedSymptoms((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  }

  async function addExtraPhoto(f: File) {
    const url = await fileToDataUrl(f);
    const all = [preview, ...extraPhotos, url].filter((u): u is string => Boolean(u));
    const limitError = validatePhotoPayload(all);
    if (limitError) {
      toast(limitError);
      return;
    }
    setExtraPhotos((prev) => [...prev, url]);
    setDiagnoseResult(null);
    setActionError(null);
  }

  function removeExtraPhoto(index: number) {
    setExtraPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function clearIdentifyPhotos() {
    setIdentifyPhotos([]);
    resetResults();
  }

  async function runIdentify() {
    if (identifyPhotos.length === 0) return;
    if (!canScan() && !betaUnlockAll) {
      const copy = UPGRADE_COPY.unlimited_scans;
      showUpgradeModal({ headline: copy.title, copy: copy.message });
      toast(`Monthly scan limit reached (${scanLimit}/month on Free).`);
      return;
    }
    setLoading(true);
    setIdentifyResult(null);
    setScanError(null);
    setScanFailureStep(null);
    setScanDebug(null);
    setActionError(null);
    try {
      const { imageDataUrls, photoRoles } = photosToRequest(identifyPhotos);
      const res = await requestIdentifyPlant({
        imageDataUrls,
        photoRoles,
      });
      if (!res.ok) {
        const msg = res.failureReason ?? res.error ?? "Identification failed";
        setScanError(msg);
        setScanFailureStep(res.failureStep ?? null);
        setScanDebug(res.debug ?? null);
        throw new Error(msg);
      }

      setIdentifyResult(res.data);
      if (!betaUnlockAll) {
        recordScanUsage();
      }
      trackEvent("scan", {
        source: res.data.source ?? "unknown",
        confident: !(res.data.not_fully_confident ?? false),
        isFirst: getScanHistory().length === 0,
      });

      try {
        const { entry, warning } = await saveScanToHistory({
          photoUrl: identifyPreview ?? imageDataUrls[0],
          photoUrls: imageDataUrls,
          result: res.data,
          friendlyHeadline: res.data.friendly_headline,
          remotePhotoUrl: res.savedPhotoUrl ?? null,
        });
        setScanHistoryId(entry.id);
        if (warning) toast(warning);
      } catch (saveErr) {
        console.error("[scanner] scan history save failed", saveErr);
        toast(SCAN_HISTORY_QUOTA_MESSAGE);
      }

      const badPhoto =
        res.data.photo_quality?.acceptable === false ||
        clientPhotoQuality?.acceptable === false;

      if (badPhoto) {
        toast("Photo quality is low. Try a clearer shot");
      } else if (res.data.not_fully_confident || res.data.providers_disagree) {
        toast("Not fully confident. Another photo may help");
      } else {
        toast("Plant identified");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : undefined;
      reportFeatureFailure("scanner", msg ?? "Identification failed", "scanner_failure");
      setActionError(
        debugUI ? msg ?? "Identification failed" : friendlyAiError(msg, "identification")
      );
      console.error("[scanner] identify failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function runDiagnose() {
    if (!preview) return;
    setLoading(true);
    setDiagnoseResult(null);
    setActionError(null);
    try {
      const res = await requestAnalyzePhoto({
        imageDataUrl: preview,
        imageDataUrls: [preview, ...extraPhotos],
        userDescription: problemDescription.trim() || undefined,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
        plantId: selectedPlant?.id,
        nickname: selectedPlant?.name,
        species: selectedPlant?.species,
        zipCode: selectedPlant?.zipCode,
        locationType: selectedPlant?.locationType,
        healthStatus: selectedPlant?.healthStatus,
        lastWateredAt: selectedPlant?.lastWateredAt ?? undefined,
        lastFertilizedAt: selectedPlant?.lastFertilizedAt ?? undefined,
      });
      if (!res.ok) throw new Error(res.error);
      setDiagnoseResult(res.data);
      recordScan();
      void publishActivityEvent({
        userId: "local-user",
        eventType: "diagnosis_completed",
        title: selectedPlant
          ? `diagnosed a problem on ${selectedPlant.name}`
          : "diagnosed a plant problem",
      });
      toast("Diagnosis complete");
    } catch (e) {
      reportFeatureFailure(
        "scanner",
        e instanceof Error ? e.message : "Diagnosis failed",
        "scanner_failure"
      );
      setActionError(friendlyAiError(e instanceof Error ? e.message : undefined, "diagnosis"));
    } finally {
      setLoading(false);
    }
  }

  async function runTagScan() {
    if (!preview) return;
    setLoading(true);
    setTagResult(null);
    setActionError(null);
    try {
      const res = await requestScanTag({ imageDataUrl: preview });
      if (!res.ok) throw new Error(res.error);
      setTagResult(res.data);
      toast("Tag scanned");
    } catch (e) {
      setActionError(friendlyAiError(e instanceof Error ? e.message : undefined, "tag scan"));
    } finally {
      setLoading(false);
    }
  }

  async function saveProgressPhoto() {
    if (!preview || !selectedPlantId) {
      toast("Select a plant first");
      return;
    }
    setLoading(true);
    try {
      await addPhoto({
        plantId: selectedPlantId,
        photoUrl: preview,
        photoType: "growth",
        notes: notes.trim() || "Progress photo",
        metadata: {
          heightInches: height ? Number(height) : null,
          visibleChange: notes.trim() || null,
        },
        file,
      });
      addGrowthEntry({
        plantId: selectedPlantId,
        photoUrl: preview,
        heightInches: height ? Number(height) : null,
        note: notes.trim() || "Progress photo",
        entryDate: new Date().toISOString(),
      });
      await markCareAction(selectedPlantId, "lastGrowthPhotoAt");
      setProgressSaved(true);
      toast("Progress photo saved.");
    } catch (e) {
      toast(friendlySaveError(e instanceof Error ? e.message : "Could not save photo"));
    } finally {
      setLoading(false);
    }
  }

  function handlePrimaryAction() {
    if (tab === "identify") runIdentify();
    else if (tab === "diagnose") runDiagnose();
    else if (tab === "tag") runTagScan();
    else saveProgressPhoto();
  }

  const actionLabels: Record<TabId, string> = {
    identify: "Identify Plant",
    diagnose: "Diagnose Issue",
    tag: "Scan Tag",
    progress: "Save Progress Photo",
  };

  const loadingLabels: Record<TabId, string> = {
    identify: "Analyzing plant…",
    diagnose: "Checking plant health…",
    tag: "Reading tag…",
    progress: "Saving photo…",
  };

  const isIdentify = tab === "identify";
  const showClientBadPhoto =
    isIdentify &&
    !identifyResult &&
    clientPhotoQuality &&
    !clientPhotoQuality.acceptable &&
    identifyPhotos.length > 0;

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-6">
      {isIdentify && !betaUnlockAll && scanLimit !== null && (
        <Card padding="sm" className="bg-gray-50 border-gray-100">
          <p className="text-xs text-gray-600">
            {scansUsed} / {scanLimit} scans used this month
            {scansRemaining !== null && scansRemaining > 0
              ? ` · ${scansRemaining} remaining`
              : " · limit reached"}
            {!canScan() && (
              <>
                {" · "}
                <Link href="/upgrade" className="text-green-700 font-medium hover:underline">
                  Upgrade to Pro
                </Link>
              </>
            )}
          </p>
        </Card>
      )}
      {isIdentify ? (
        <>
          <LiveCameraScanner
            photos={identifyPhotos}
            onChange={handleIdentifyPhotosChange}
            loading={loading}
            loadingLabel={loadingLabels.identify}
            onLimitError={(message) => toast(message)}
            cameraActive={!identifyResult}
          />
          {showClientBadPhoto && <BadPhotoGuidance quality={clientPhotoQuality} />}
          {scanError && debugUI && (
            <ScannerDebugErrorPanel
              error={scanError}
              failureStep={scanFailureStep}
              debug={scanDebug}
            />
          )}
        </>
      ) : (
        <LegacySingleCapture
          preview={preview}
          loading={loading}
          loadingLabel={loadingLabels[tab]}
          emptyHint={
            tab === "diagnose"
              ? "Focus on the problem area: yellow leaves, spots, or pests"
              : tab === "tag"
                ? "Photograph the nursery tag straight-on"
                : "Same angle as last time for best comparison"
          }
          onFile={handleFile}
          onClear={clearCapture}
        />
      )}

      {tab === "diagnose" && !preview && (
        <Planty variant="diagnosing" subtle message="Show me the damage." />
      )}

      {tab === "diagnose" && preview && loading && (
        <Planty variant="diagnosing" subtle message="Plant drama detected. Investigating." />
      )}

      {tab === "diagnose" && !preview && (
        <Card padding="md" className="bg-green-50/50 border-green-100">
          <p className="text-xs font-semibold text-green-800 uppercase tracking-wide flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            More angles = better diagnosis
          </p>
          <ol className="text-sm text-gray-700 mt-2 space-y-1 list-decimal pl-4">
            <li>Whole plant</li>
            <li>Affected leaf close-up</li>
            <li>Leaf underside</li>
            <li>Stem and soil area</li>
            <li>Pest close-up if visible</li>
          </ol>
          <p className="text-xs text-gray-500 mt-2">
            Start with one photo. You can add more angles after.
          </p>
        </Card>
      )}

      {tab === "diagnose" && preview && !diagnoseResult && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {extraPhotos.map((url, i) => (
              <div key={`${i}-${url.slice(-16)}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Extra angle ${i + 1}`}
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeExtraPhoto(i)}
                  aria-label={`Remove extra angle ${i + 1}`}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900/80 text-white flex items-center justify-center touch-manipulation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {extraPhotos.length < 2 && (
              <button
                type="button"
                onClick={() => extraPhotoInputRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 flex flex-col items-center justify-center gap-0.5 touch-manipulation hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-[9px] font-medium">Add angle</span>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            More angles = better diagnosis. Leaf close-up, underside, stem, or soil.
          </p>
        </div>
      )}

      {tab === "diagnose" && (
        <input
          ref={extraPhotoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (preview) void addExtraPhoto(f);
              else void handleFile(f);
            }
            e.target.value = "";
          }}
        />
      )}

      {actionError && !loading && tab === "diagnose" && (
        <Card padding="md" className="border-amber-200 bg-amber-50/70 space-y-3">
          <p className="text-sm font-semibold text-gray-900">
            We need one clearer photo or a short description.
          </p>
          <p className="text-sm text-amber-900/90">{actionError}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCapture}
              className="touch-manipulation"
            >
              <RotateCcw className="w-4 h-4" />
              Retake photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => extraPhotoInputRef.current?.click()}
              className="touch-manipulation"
            >
              <ImagePlus className="w-4 h-4" />
              Add leaf close-up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                descriptionRef.current?.focus();
                descriptionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="touch-manipulation"
            >
              <PencilLine className="w-4 h-4" />
              Describe the problem
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => extraPhotoInputRef.current?.click()}
              className="touch-manipulation"
            >
              <ImagePlus className="w-4 h-4" />
              Upload from gallery
            </Button>
            <Button size="sm" onClick={runDiagnose} className="touch-manipulation col-span-2">
              Try again
            </Button>
          </div>
        </Card>
      )}

      {actionError && !loading && tab !== "diagnose" && (
        <Card padding="md" className="border-red-100 bg-red-50/60 space-y-3">
          <p className="text-sm font-medium text-gray-900">
            That didn&apos;t work this time.
          </p>
          <p className="text-sm text-red-700">{actionError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrimaryAction}
            className="touch-manipulation"
          >
            Try again
          </Button>
        </Card>
      )}

      {loading && isIdentify && (
        <div className="flex items-center justify-center gap-2 text-sm text-green-700 py-1">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-green-500 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          Matching against plant databases…
        </div>
      )}

      {isIdentify && !identifyResult && (
        <Button
          onClick={runIdentify}
          disabled={identifyPhotos.length === 0 || loading}
          loading={loading}
          size="lg"
          className="w-full h-14 text-base touch-manipulation shadow-lg shadow-green-600/20"
        >
          <Camera className="w-5 h-5" />
          Identify Plant
          {identifyPhotos.length > 1 && (
            <span className="text-green-200 text-sm ml-1">({identifyPhotos.length} photos)</span>
          )}
        </Button>
      )}

      <div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">
          {isIdentify ? "Other camera tools" : "Camera mode"}
        </p>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                resetResults();
              }}
              className={cn(
                "flex-1 min-w-[72px] flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[11px] font-medium touch-manipulation transition-colors",
                tab === t.id ? "bg-white text-green-700 shadow-sm" : "text-gray-500"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!isIdentify && (
        <p className="text-sm text-gray-500 text-center px-2">
          {tab === "diagnose" && "Snap a problem area for a plant health check"}
          {tab === "tag" && "Read nursery tags to prefill a new plant"}
          {tab === "progress" && "Track growth with dated progress photos"}
        </p>
      )}

      {tab === "progress" && plants.length === 0 && (
        <Card padding="md" className="text-center space-y-3 border-gray-100 bg-gray-50/60">
          <p className="text-sm font-medium text-gray-900">
            Progress photos are linked to a plant
          </p>
          <p className="text-sm text-gray-500">
            Add your first plant, then come back here to start tracking its growth.
          </p>
          <Link href="/plants/new">
            <Button size="sm" variant="outline" className="touch-manipulation">
              <Plus className="w-4 h-4" />
              Add a plant
            </Button>
          </Link>
        </Card>
      )}

      {(tab === "diagnose" || tab === "progress") && plants.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            {tab === "progress" ? "Which plant?" : "Link to plant (optional)"}
          </label>
          <select
            value={selectedPlantId}
            onChange={(e) => setSelectedPlantId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm bg-white touch-manipulation"
          >
            <option value="">{tab === "progress" ? "Select a plant…" : "No plant selected"}</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === "progress" && preview && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Height (in)"
            placeholder="Optional"
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
          <Input
            label="What changed?"
            placeholder="New leaves, taller…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {tab === "diagnose" && !diagnoseResult && (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="diagnose-description"
              className="text-sm font-medium text-gray-700 mb-1.5 block"
            >
              Tell PlantPal what you&apos;re seeing
            </label>
            <textarea
              id="diagnose-description"
              ref={descriptionRef}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Yellow leaves, white powder, bugs under leaves, brown spots, wilting, slow growth..."
              rows={3}
              maxLength={600}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 touch-manipulation"
            />
            <p className="text-xs text-gray-400 mt-1">
              Optional, but it makes the diagnosis a lot more accurate.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_CHIPS.map((chip) => {
              const active = selectedSymptoms.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleSymptom(chip)}
                  aria-pressed={active}
                  className={cn(
                    "text-xs font-medium px-3 py-2 rounded-full border transition-colors touch-manipulation",
                    active
                      ? "border-green-600 bg-green-50 text-green-800"
                      : "border-gray-200 bg-white text-gray-600 hover:border-green-300"
                  )}
                >
                  {chip}
                </button>
              );
            })}
          </div>
          {symptomHints.length > 0 && (
            <div className="rounded-xl bg-amber-50/70 border border-amber-100 px-3 py-2.5 space-y-1.5">
              <p className="text-xs font-medium text-amber-800">
                Sounds like it could be:
              </p>
              {symptomHints.map((hint) => (
                <p key={hint.reference.issue} className="text-xs text-amber-900">
                  <span className="font-semibold">{hint.reference.issue}.</span>{" "}
                  {hint.reference.immediateActions[0]}.
                </p>
              ))}
              <p className="text-[11px] text-amber-700/70">
                Reference hints only. The photo scan makes the real call.
              </p>
            </div>
          )}
        </div>
      )}

      {!isIdentify && (
        <Button
          onClick={handlePrimaryAction}
          disabled={!preview || loading || (tab === "progress" && !selectedPlantId)}
          loading={loading}
          size="lg"
          className="w-full h-14 text-base touch-manipulation"
        >
          {actionLabels[tab]}
          {tab === "diagnose" && extraPhotos.length > 0 && (
            <span className="text-green-200 text-sm ml-1">({extraPhotos.length + 1} photos)</span>
          )}
        </Button>
      )}

      {identifyResult && isIdentify && (
        <IdentifyPlantResults
          result={identifyResult}
          preview={identifyPreview}
          previews={identifyPhotos.map((p) => p.dataUrl)}
          clientPhotoQuality={clientPhotoQuality}
          scanHistoryId={scanHistoryId}
          onRetake={clearIdentifyPhotos}
        />
      )}

      {diagnoseResult && tab === "diagnose" && (
        <Card padding="md" className="page-enter space-y-4 border-amber-100">
          <div className="flex items-center gap-2 flex-wrap">
            <Stethoscope className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-gray-900">Likely diagnosis</h2>
            <Badge variant={diagnoseResult.severity === "serious" ? "danger" : "warning"}>
              {diagnoseResult.severity}
            </Badge>
            <Badge
              variant={diagnoseResult.confidence === "high" ? "success" : "outline"}
              className="ml-auto"
            >
              {diagnoseResult.confidence} confidence
            </Badge>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
              Plant ID · {diagnoseResult.plant_id_confidence} confidence
            </p>
            <p className="text-sm text-gray-800 mt-0.5">
              {diagnoseResult.plant_id_guess ??
                "We're not fully sure what plant this is, but we can still read the symptoms."}
            </p>
            {diagnoseResult.plant_id_guess &&
              diagnoseResult.plant_id_confidence === "low" && (
                <p className="text-xs text-gray-500 mt-1">
                  Not fully sure on the plant, but the symptoms below still apply.
                </p>
              )}
          </div>

          <p className="font-medium text-gray-900">{diagnoseResult.issue_detected}</p>
          {diagnoseResult.likely_causes.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                Top possible issues
              </p>
              <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                {diagnoseResult.likely_causes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnoseResult.confidence_reason && (
            <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 px-3 py-2.5">
              <p className="text-[10px] font-medium text-indigo-700 uppercase tracking-wide">
                Why
              </p>
              <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
                {diagnoseResult.confidence_reason}
              </p>
            </div>
          )}

          {diagnoseResult.visible_observations.length > 0 &&
            diagnoseResult.source !== "mock" && (
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                  What the photos show
                </p>
                <ul className="text-sm text-gray-600 list-disc pl-4 space-y-0.5">
                  {diagnoseResult.visible_observations.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </div>
            )}

          {diagnoseResult.info_needed.length > 0 && (
            <div className="rounded-xl bg-amber-50/70 border border-amber-100 px-3 py-2.5">
              <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wide">
                To be more sure
              </p>
              <ul className="text-sm text-gray-700 list-disc pl-4 space-y-0.5 mt-1">
                {diagnoseResult.info_needed.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="p-3 rounded-xl bg-green-50 border border-green-100">
            <p className="text-xs font-medium text-green-700 uppercase mb-1">Do today</p>
            <p className="text-sm text-gray-800">{diagnoseResult.what_to_do_today}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50/80 border border-red-100">
            <p className="text-xs font-medium text-red-700 uppercase mb-1">Avoid</p>
            <p className="text-sm text-gray-800">{diagnoseResult.what_to_avoid}</p>
          </div>
          <p className="text-sm text-gray-500">
            <span className="font-medium">Rescan:</span> {diagnoseResult.when_to_rescan}
          </p>
          {diagnosisReference && (
            <div className="rounded-xl bg-sky-50/70 border border-sky-100 px-3 py-2.5 space-y-1">
              <p className="text-[10px] font-medium text-sky-700 uppercase tracking-wide">
                From the plant problem library · {diagnosisReference.issue}
              </p>
              {diagnosisReference.spreadsFast && (
                <p className="text-xs font-medium text-sky-900">
                  This one spreads fast. Isolate or treat soon.
                </p>
              )}
              <p className="text-sm text-gray-700">
                Prevent next time: {diagnosisReference.prevention[0]}.
              </p>
              <p className="text-xs text-gray-500">
                Typical rescan window: {diagnosisReference.whenToRescan}.
              </p>
            </div>
          )}
          {diagnoseResult.severity !== "serious" && (
            <Planty variant="happy" subtle message="Good news. It's probably fixable." />
          )}
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
            {diagnoseResult.safety_note}
          </p>
          {diagnoseResult.recommended_lesson && (
            <Link href={`/learn/${diagnoseResult.recommended_lesson}`}>
              <Button variant="secondary" size="sm" className="w-full">
                <BookOpen className="w-4 h-4" />
                Recommended lesson
              </Button>
            </Link>
          )}
          <RequestExpertReview
            plantId={selectedPlantId || null}
            cropType={selectedPlant?.species ?? diagnoseResult.plant_id_guess ?? undefined}
            defaultDescription={problemDescription}
          />
        </Card>
      )}

      {tagResult && tab === "tag" && (
        <Card padding="md" className="page-enter space-y-3">
          <h2 className="text-lg font-bold text-gray-900">{tagResult.plant_name}</h2>
          {tagResult.variety && (
            <p className="text-sm text-gray-500">Variety: {tagResult.variety}</p>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {tagResult.size && <InfoCell label="Size" value={tagResult.size} />}
            {tagResult.price && <InfoCell label="Price" value={tagResult.price} />}
            {tagResult.sun_needs && <InfoCell label="Sun" value={tagResult.sun_needs} />}
            {tagResult.water_needs && <InfoCell label="Water" value={tagResult.water_needs} />}
            {tagResult.hardiness_zone && (
              <InfoCell label="Zone" value={tagResult.hardiness_zone} />
            )}
          </div>
          {tagResult.care_instructions && (
            <p className="text-sm text-gray-600 leading-relaxed">{tagResult.care_instructions}</p>
          )}
          <Button
            className="w-full"
            onClick={() => {
              sessionStorage.setItem(
                TAG_PREFILL_KEY,
                JSON.stringify({
                  ...tagResult,
                  imageDataUrl: preview,
                })
              );
              window.location.href = "/plants/new?from=tag";
            }}
          >
            <Plus className="w-4 h-4" />
            Add Plant from Tag
          </Button>
        </Card>
      )}

      {progressSaved && tab === "progress" && (
        <Card padding="md" className="text-center border-green-100 bg-green-50/50">
          <p className="font-semibold text-green-800">Progress photo saved.</p>
          {selectedPlantId && (
            <Link href={`/plants/${selectedPlantId}#growth`} className="text-sm text-green-600 mt-2 inline-block">
              View growth timeline →
            </Link>
          )}
        </Card>
      )}

      {isIdentify && (
        <p className="text-center text-xs text-gray-400">
          <Link href="/scanner/history" className="text-green-600 hover:underline">
            View scan history →
          </Link>
        </p>
      )}

      {!isIdentify && (
        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          Plant Camera · identify is the default tab
        </p>
      )}
    </div>
  );
}

function LegacySingleCapture({
  preview,
  loading,
  loadingLabel,
  emptyHint,
  onFile,
  onClear,
}: {
  preview: string | null;
  loading: boolean;
  loadingLabel: string;
  emptyHint: string;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  return (
    <CameraCapture
      preview={preview}
      loading={loading}
      loadingLabel={loadingLabel}
      onFile={onFile}
      onClear={onClear}
      emptyHint={emptyHint}
    />
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-gray-50">
      <p className="text-[10px] uppercase text-gray-400 font-medium">{label}</p>
      <p className="text-gray-800 font-medium">{value}</p>
    </div>
  );
}

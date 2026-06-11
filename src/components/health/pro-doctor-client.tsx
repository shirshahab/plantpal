"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  FileClock,
  FlaskConical,
  RefreshCw,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePlants } from "@/lib/store/plants-provider";
import { useAuth } from "@/lib/store/auth-provider";
import { useToast } from "@/lib/store/toast-provider";
import { compressImageFile } from "@/lib/scanner/compress-image";
import { friendlyAiError } from "@/lib/errors/user-messages";
import {
  getHealthReport,
  listHealthReports,
  listExpertReviewRequests,
  saveHealthReport,
  type ExpertReviewRequest,
} from "@/lib/health/report-storage";
import { buildFeedbackSignals } from "@/lib/health/feedback";
import { ProReportView } from "@/components/health/pro-report-view";
import {
  HEALTH_DISCLAIMER,
  PHOTO_SLOTS,
  SYMPTOM_OPTIONS,
  type CommercialContext,
  type GrowthStage,
  type PhotoSlotId,
  type ProDiagnosisResult,
  type ProEnvironment,
  type ProHealthReport,
  type SymptomId,
} from "@/lib/types/health";

const GROWTH_STAGE_OPTIONS = [
  { value: "seedling", label: "Seedling / cutting" },
  { value: "vegetative", label: "Vegetative growth" },
  { value: "flowering", label: "Flowering" },
  { value: "fruiting", label: "Fruiting" },
  { value: "mature", label: "Mature / established" },
  { value: "dormant", label: "Dormant" },
];

const EMPTY_ENV: ProEnvironment = {
  temperature: "",
  humidity: "",
  airflow: "",
  lightIntensity: "",
  wateringFrequency: "",
  fertilizerUsed: "",
  pruningHistory: "",
};

/** Small thumbnail kept on the report for the PDF export (~10–20 KB each). */
function makeThumb(dataUrl: string, maxEdge = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => reject(new Error("thumb failed"));
    img.src = dataUrl;
  });
}

const EMPTY_COMMERCIAL: CommercialContext = {
  enabled: false,
  plantCount: null,
  roomName: "",
  cropType: "",
  estimatedCropValue: "",
  affectedPercent: null,
  growthPhase: "",
  harvestTimeline: "",
};

function PhotoSlot({
  slotId,
  label,
  dataUrl,
  onPick,
  onClear,
}: {
  slotId: PhotoSlotId;
  label: string;
  dataUrl: string | null;
  onPick: (slotId: PhotoSlotId, file: File) => void;
  onClear: (slotId: PhotoSlotId) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 p-1 text-center transition-colors touch-manipulation overflow-hidden",
          dataUrl
            ? "border-green-300 bg-green-50"
            : "border-gray-200 bg-gray-50 hover:border-green-300"
        )}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-[10px]" />
        ) : (
          <>
            <Camera className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] leading-tight text-gray-500 font-medium">
              {label}
            </span>
          </>
        )}
      </button>
      {dataUrl && (
        <button
          type="button"
          onClick={() => onClear(slotId)}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center"
          aria-label={`Remove ${label} photo`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(slotId, file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function ProDoctorClient() {
  const searchParams = useSearchParams();
  const { plants } = usePlants();
  const { user } = useAuth();
  const { toast } = useToast();

  // Intake state
  const [plantId, setPlantId] = useState("");
  const [species, setSpecies] = useState("");
  const [growthStage, setGrowthStage] = useState<GrowthStage>("mature");
  const [locationType, setLocationType] = useState<"indoor" | "outdoor">("outdoor");
  const [zipCode, setZipCode] = useState("");
  const [photos, setPhotos] = useState<Partial<Record<PhotoSlotId, string>>>({});
  const [symptoms, setSymptoms] = useState<SymptomId[]>([]);
  const [otherSymptom, setOtherSymptom] = useState("");
  const [env, setEnv] = useState<ProEnvironment>(EMPTY_ENV);
  const [commercial, setCommercial] = useState<CommercialContext>(EMPTY_COMMERCIAL);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ProHealthReport | null>(null);
  const [recentReports, setRecentReports] = useState<ProHealthReport[]>([]);
  const [expertQueue, setExpertQueue] = useState<ExpertReviewRequest[]>([]);

  useEffect(() => {
    setRecentReports(listHealthReports().slice(0, 5));
    setExpertQueue(listExpertReviewRequests().filter((r) => r.status === "pending"));
  }, [report]);

  // Re-open an existing report from the dashboard alert (?reportId=…).
  useEffect(() => {
    const reportId = searchParams.get("reportId");
    if (reportId) {
      const existing = getHealthReport(reportId);
      if (existing) setReport(existing);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!zipCode && plants[0]?.zipCode) setZipCode(plants[0].zipCode);
  }, [plants, zipCode]);

  const linkedPlant = useMemo(
    () => plants.find((p) => p.id === plantId) ?? null,
    [plants, plantId]
  );

  function selectPlant(id: string) {
    setPlantId(id);
    const plant = plants.find((p) => p.id === id);
    if (plant) {
      setSpecies(plant.species || plant.name);
      setLocationType(plant.locationType === "indoor" ? "indoor" : "outdoor");
      if (plant.zipCode) setZipCode(plant.zipCode);
    }
  }

  async function pickPhoto(slotId: PhotoSlotId, file: File) {
    try {
      const dataUrl = await compressImageFile(file);
      setPhotos((prev) => ({ ...prev, [slotId]: dataUrl }));
    } catch {
      toast("Could not read that image. Try another photo.");
    }
  }

  function toggleSymptom(id: SymptomId) {
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function setEnvField(key: keyof ProEnvironment, value: string) {
    setEnv((prev) => ({ ...prev, [key]: value }));
  }

  function setCommercialField<K extends keyof CommercialContext>(
    key: K,
    value: CommercialContext[K]
  ) {
    setCommercial((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit =
    species.trim().length > 0 &&
    (symptoms.length > 0 || Object.keys(photos).length > 0);

  async function runDiagnosis() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);

    const photoSlots = Object.keys(photos) as PhotoSlotId[];
    const payload = {
      species: species.trim(),
      growthStage,
      locationType,
      zipCode: zipCode.trim(),
      photos: photoSlots.map((slot) => photos[slot]),
      symptoms,
      otherSymptom: otherSymptom.trim(),
      environment: env,
      commercial: commercial.enabled ? commercial : null,
      feedbackSignals: buildFeedbackSignals(),
    };

    try {
      const res = await fetch("/api/ai/pro-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Non-JSON responses (timeouts, body-size limits) would crash res.json().
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setError(
          res.status === 413
            ? "Photos are too large. Try again with fewer or smaller photos."
            : "The diagnosis service took too long. Try again with fewer photos."
        );
        return;
      }

      const json = (await res.json()) as
        | { ok: true; data: ProDiagnosisResult }
        | { ok: false; error: string };

      if (!json.ok) {
        setError(friendlyAiError(json.error, "diagnosis"));
        return;
      }

      // Thumbnails for the exportable report (full photos stay off-device).
      const photoThumbs: Partial<Record<PhotoSlotId, string>> = {};
      for (const slot of photoSlots) {
        try {
          photoThumbs[slot] = await makeThumb(photos[slot]!);
        } catch {
          // Thumbnail is optional — skip on failure.
        }
      }

      const now = new Date().toISOString();
      const fullReport: ProHealthReport = {
        id: crypto.randomUUID(),
        plantId: plantId || null,
        species: species.trim(),
        growthStage,
        locationType,
        zipCode: zipCode.trim(),
        photoSlots,
        photoThumbs,
        symptoms,
        otherSymptom: otherSymptom.trim(),
        environment: env,
        diagnosis: json.data.diagnosis,
        remedyPlan: json.data.remedyPlan,
        prognosis: json.data.prognosis,
        secondOpinion: json.data.secondOpinion,
        commercialContext: commercial.enabled ? commercial : null,
        commercialAssessment: json.data.commercialAssessment,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };

      saveHealthReport(fullReport, user?.id);
      setReport(fullReport);
      toast(
        json.data.debug.fallbackUsed
          ? "Diagnosis ready (pattern-based analysis)."
          : "Diagnosis ready."
      );
    } catch {
      setError("Could not reach the diagnosis service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (report) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <PageHeader
          title="Health Report"
          description={`${report.species} · ${new Date(report.createdAt).toLocaleDateString()}`}
          action={
            <Button variant="secondary" size="sm" onClick={() => setReport(null)}>
              <RefreshCw className="w-4 h-4" /> New diagnosis
            </Button>
          }
        />
        <ProReportView
          report={report}
          onStatusChange={(status) =>
            setReport((prev) => (prev ? { ...prev, status } : prev))
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Advanced Plant Doctor"
        description="A deeper diagnostic workflow for distressed plants."
      />

      <Card padding="md" className="bg-green-50/50 border-green-100">
        <p className="text-sm text-gray-600">
          More detail means a more useful diagnosis: photos, symptoms, and
          environment all help. PlantPal uses cautious, evidence-based
          language and will tell you when expert verification is worth it.
        </p>
      </Card>

      {/* 1. Plant */}
      <Card padding="md" className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">1. The plant</h2>
        {plants.length > 0 && (
          <Select
            label="Link to one of your plants (optional)"
            value={plantId}
            onChange={(e) => selectPlant(e.target.value)}
            options={[
              { value: "", label: "Not in my garden / skip" },
              ...plants.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        )}
        <Input
          label="Plant species"
          placeholder="e.g. Bougainvillea, Meyer Lemon, tomato…"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Growth stage"
            value={growthStage}
            onChange={(e) => setGrowthStage(e.target.value as GrowthStage)}
            options={GROWTH_STAGE_OPTIONS}
          />
          <Select
            label="Location"
            value={locationType}
            onChange={(e) => setLocationType(e.target.value as "indoor" | "outdoor")}
            options={[
              { value: "outdoor", label: "Outdoor" },
              { value: "indoor", label: "Indoor" },
            ]}
          />
        </div>
        <Input
          label="ZIP code"
          placeholder="e.g. 91107"
          value={zipCode}
          inputMode="numeric"
          maxLength={5}
          onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
        />
        {linkedPlant && (
          <p className="text-xs text-gray-400">
            Linked to {linkedPlant.name}. The report and recovery tasks will
            reference this plant.
          </p>
        )}
      </Card>

      {/* 2. Photos */}
      <Card padding="md" className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">2. Photos</h2>
        <p className="text-sm text-gray-500">
          Add as many angles as you can. Leaf undersides and close-ups help the
          most. All photos are optional.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PHOTO_SLOTS.map((slot) => (
            <PhotoSlot
              key={slot.id}
              slotId={slot.id}
              label={slot.label}
              dataUrl={photos[slot.id] ?? null}
              onPick={pickPhoto}
              onClear={(id) =>
                setPhotos((prev) => {
                  const next = { ...prev };
                  delete next[id];
                  return next;
                })
              }
            />
          ))}
        </div>
      </Card>

      {/* 3. Symptoms */}
      <Card padding="md" className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">3. Symptoms</h2>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSymptom(s.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium border transition-colors touch-manipulation",
                symptoms.includes(s.id)
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        {symptoms.includes("other") && (
          <Input
            label="Describe the other symptom"
            placeholder="What else are you seeing?"
            value={otherSymptom}
            onChange={(e) => setOtherSymptom(e.target.value)}
          />
        )}
      </Card>

      {/* 4. Environment */}
      <Card padding="md" className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">4. Environment</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Temperature"
            placeholder="e.g. 75–85°F days"
            value={env.temperature}
            onChange={(e) => setEnvField("temperature", e.target.value)}
          />
          <Input
            label="Humidity"
            placeholder="e.g. around 65%"
            value={env.humidity}
            onChange={(e) => setEnvField("humidity", e.target.value)}
          />
          <Select
            label="Airflow"
            value={env.airflow}
            onChange={(e) => setEnvField("airflow", e.target.value)}
            options={[
              { value: "", label: "Not sure" },
              { value: "poor airflow / stagnant", label: "Poor / stagnant" },
              { value: "moderate airflow", label: "Moderate" },
              { value: "good airflow", label: "Good circulation" },
            ]}
          />
          <Select
            label="Light intensity"
            value={env.lightIntensity}
            onChange={(e) => setEnvField("lightIntensity", e.target.value)}
            options={[
              { value: "", label: "Not sure" },
              { value: "low light", label: "Low light" },
              { value: "bright indirect light", label: "Bright indirect" },
              { value: "direct sun / full sun", label: "Direct / full sun" },
              { value: "grow lights", label: "Grow lights" },
            ]}
          />
        </div>
        <Input
          label="Watering frequency"
          placeholder="e.g. every 3 days, daily, when soil is dry"
          value={env.wateringFrequency}
          onChange={(e) => setEnvField("wateringFrequency", e.target.value)}
        />
        <Input
          label="Fertilizer used recently"
          placeholder="e.g. balanced liquid feed 1 week ago, none"
          value={env.fertilizerUsed}
          onChange={(e) => setEnvField("fertilizerUsed", e.target.value)}
        />
        <Input
          label="Pruning / defoliation history"
          placeholder="e.g. heavy defoliation 2 weeks ago, none"
          value={env.pruningHistory}
          onChange={(e) => setEnvField("pruningHistory", e.target.value)}
        />
      </Card>

      {/* 5. Commercial mode */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-indigo-600" /> Commercial grower mode
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              For controlled environment grows and high-value crops. Adds
              room-level risk assessment.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={commercial.enabled}
            onClick={() => setCommercialField("enabled", !commercial.enabled)}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors shrink-0 touch-manipulation",
              commercial.enabled ? "bg-indigo-600" : "bg-gray-200"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                commercial.enabled ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            />
          </button>
        </div>

        {commercial.enabled && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Number of plants"
                placeholder="e.g. 20"
                inputMode="numeric"
                value={commercial.plantCount ?? ""}
                onChange={(e) =>
                  setCommercialField(
                    "plantCount",
                    e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null
                  )
                }
              />
              <Input
                label="Affected canopy %"
                placeholder="e.g. 15"
                inputMode="numeric"
                value={commercial.affectedPercent ?? ""}
                onChange={(e) =>
                  setCommercialField(
                    "affectedPercent",
                    e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null
                  )
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Room / zone name"
                placeholder="e.g. Flower Room B"
                value={commercial.roomName}
                onChange={(e) => setCommercialField("roomName", e.target.value)}
              />
              <Input
                label="Crop type"
                placeholder="e.g. high-value crop"
                value={commercial.cropType}
                onChange={(e) => setCommercialField("cropType", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Growth phase"
                placeholder="e.g. week 4 of flower"
                value={commercial.growthPhase}
                onChange={(e) => setCommercialField("growthPhase", e.target.value)}
              />
              <Input
                label="Harvest timeline"
                placeholder="e.g. 3 weeks out"
                value={commercial.harvestTimeline}
                onChange={(e) => setCommercialField("harvestTimeline", e.target.value)}
              />
            </div>
            <Input
              label="Estimated crop value (optional)"
              placeholder="Kept private, used only to weight urgency"
              value={commercial.estimatedCropValue}
              onChange={(e) => setCommercialField("estimatedCropValue", e.target.value)}
            />
          </div>
        )}
      </Card>

      {error && (
        <div className="text-sm bg-red-50 rounded-lg px-3 py-2 space-y-1">
          <p className="text-red-600">{error}</p>
          <p className="text-red-500 text-xs">
            Your answers are kept. Tap the button below to try again.
          </p>
        </div>
      )}

      <Button
        className="w-full touch-manipulation"
        loading={loading}
        disabled={!canSubmit}
        onClick={runDiagnosis}
      >
        {loading ? "Analyzing…" : "Run Diagnosis"}
      </Button>
      {!canSubmit && (
        <p className="text-xs text-gray-400 text-center -mt-3">
          Enter the species plus at least one symptom or photo.
        </p>
      )}

      {/* Recent reports */}
      {recentReports.length > 0 && (
        <Card padding="md" className="space-y-2">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileClock className="w-4 h-4 text-gray-500" /> Recent reports
          </h2>
          <div className="divide-y divide-gray-100">
            {recentReports.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReport(r)}
                className="w-full flex items-center gap-3 py-2.5 text-left touch-manipulation"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-gray-900 truncate">
                    {r.diagnosis.likelyIssue}, {r.species}
                  </span>
                  <span className="block text-xs text-gray-400 mt-0.5 capitalize">
                    {new Date(r.createdAt).toLocaleDateString()} · {r.status} ·{" "}
                    {r.diagnosis.confidence}% confidence
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Expert review queue */}
      {expertQueue.length > 0 && (
        <Card padding="md" className="space-y-2 border-violet-100 bg-violet-50/40">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-violet-600" /> Expert review queue
          </h2>
          <p className="text-xs text-gray-500">
            {expertQueue.length} request{expertQueue.length === 1 ? "" : "s"} waiting.
            We&apos;ll follow up as experts come online.
          </p>
          <ul className="space-y-1.5">
            {expertQueue.slice(0, 3).map((req) => {
              const linked = recentReports.find((r) => r.id === req.healthReportId);
              return (
                <li key={req.id} className="text-sm text-gray-600">
                  {linked
                    ? `${linked.diagnosis.likelyIssue}, ${linked.species}`
                    : "Health report"}{" "}
                  <span className="text-xs text-violet-600 font-medium capitalize">
                    ({req.urgency} urgency · pending)
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <p className="text-xs text-gray-400 px-1">{HEALTH_DISCLAIMER}</p>
    </div>
  );
}

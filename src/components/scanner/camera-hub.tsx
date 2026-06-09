"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Leaf,
  Stethoscope,
  Tag,
  TrendingUp,
  Sparkles,
  Plus,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CameraCapture, fileToDataUrl } from "@/components/scanner/camera-capture";
import {
  requestIdentifyPlant,
  requestScanTag,
  requestAnalyzePhoto,
} from "@/lib/ai/client";
import type {
  AIPhotoAnalyzeResponse,
  PlantIdentificationResponse,
  TagScanResponse,
} from "@/lib/types/ai";
import { usePlants } from "@/lib/store/plants-provider";
import { usePhotos } from "@/lib/store/photos-provider";
import { useEngagement } from "@/lib/store/engagement-provider";
import { useToast } from "@/lib/store/toast-provider";
import { friendlyAiError } from "@/lib/errors/user-messages";
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
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [identifyResult, setIdentifyResult] = useState<PlantIdentificationResponse | null>(null);
  const [diagnoseResult, setDiagnoseResult] = useState<AIPhotoAnalyzeResponse | null>(null);
  const [tagResult, setTagResult] = useState<TagScanResponse | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);

  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");

  const { plants, markCareAction } = usePlants();
  const { addPhoto } = usePhotos();
  const { addGrowthEntry, recordScan } = useEngagement();
  const { toast } = useToast();

  const selectedPlant = plants.find((p) => p.id === selectedPlantId);

  function resetResults() {
    setIdentifyResult(null);
    setDiagnoseResult(null);
    setTagResult(null);
    setProgressSaved(false);
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
    resetResults();
  }

  async function runIdentify() {
    if (!preview) return;
    setLoading(true);
    setIdentifyResult(null);
    try {
      const res = await requestIdentifyPlant({ imageDataUrl: preview });
      if (!res.ok) throw new Error(res.error);
      setIdentifyResult(res.data);
      toast(res.data.source === "ai" ? "Plant identified" : "Demo identification ready");
    } catch (e) {
      toast(friendlyAiError(e instanceof Error ? e.message : undefined, "identification"));
    } finally {
      setLoading(false);
    }
  }

  async function runDiagnose() {
    if (!preview) return;
    setLoading(true);
    setDiagnoseResult(null);
    try {
      const res = await requestAnalyzePhoto({
        imageDataUrl: preview,
        plantId: selectedPlant?.id,
        nickname: selectedPlant?.name,
        species: selectedPlant?.species,
        zipCode: selectedPlant?.zipCode,
        locationType: selectedPlant?.locationType,
        healthStatus: selectedPlant?.healthStatus,
      });
      if (!res.ok) throw new Error(res.error);
      setDiagnoseResult(res.data);
      recordScan();
      toast("Diagnosis complete");
    } catch (e) {
      toast(friendlyAiError(e instanceof Error ? e.message : undefined, "diagnosis"));
    } finally {
      setLoading(false);
    }
  }

  async function runTagScan() {
    if (!preview) return;
    setLoading(true);
    setTagResult(null);
    try {
      const res = await requestScanTag({ imageDataUrl: preview });
      if (!res.ok) throw new Error(res.error);
      setTagResult(res.data);
      toast("Tag scanned");
    } catch (e) {
      toast(friendlyAiError(e instanceof Error ? e.message : undefined, "tag scan"));
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
    } catch {
      toast("Could not save photo");
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
    identify: "Identifying plant…",
    diagnose: "Checking plant health…",
    tag: "Reading tag…",
    progress: "Saving photo…",
  };

  const emptyHints: Record<TabId, string> = {
    identify: "Snap the whole plant — leaves, stems, and pot help ID",
    diagnose: "Focus on the problem area — yellow leaves, spots, or pests",
    tag: "Photograph the nursery tag straight-on",
    progress: "Same angle as last time for best comparison",
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-4">
      <div className="text-center space-y-2 pt-1">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-green-600 text-white shadow-xl shadow-green-600/30">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Plant Camera</h1>
        <p className="text-sm text-gray-500">Identify, diagnose, scan tags, track growth</p>
      </div>

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

      {(tab === "diagnose" || tab === "progress") && plants.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            {tab === "progress" ? "Which plant?" : "Link to plant (optional)"}
          </label>
          <select
            value={selectedPlantId}
            onChange={(e) => setSelectedPlantId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm bg-white"
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

      <CameraCapture
        preview={preview}
        loading={loading}
        loadingLabel={loadingLabels[tab]}
        onFile={handleFile}
        onClear={clearCapture}
        emptyHint={emptyHints[tab]}
      />

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

      <Button
        onClick={handlePrimaryAction}
        disabled={!preview || loading || (tab === "progress" && !selectedPlantId)}
        loading={loading}
        size="lg"
        className="w-full h-14 text-base touch-manipulation"
      >
        {actionLabels[tab]}
      </Button>

      {identifyResult && tab === "identify" && (
        <Card padding="md" className="page-enter space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{identifyResult.common_name}</h2>
              <p className="text-sm text-gray-500 italic">{identifyResult.scientific_name}</p>
            </div>
            <Badge variant={identifyResult.confidence === "high" ? "success" : "warning"}>
              {identifyResult.confidence}
            </Badge>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{identifyResult.care_summary}</p>
          {identifyResult.toxicity_warning && (
            <p className="text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {identifyResult.toxicity_warning}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Link
              href={`/plants/new?name=${encodeURIComponent(identifyResult.common_name)}&species=${encodeURIComponent(identifyResult.scientific_name)}&locationType=${identifyResult.suggested_location === "indoor" ? "indoor" : "outdoor"}&sunExposure=${identifyResult.suggested_sun}${identifyResult.database_species_id ? `&speciesId=${identifyResult.database_species_id}` : ""}`}
            >
              <Button className="w-full">
                <Plus className="w-4 h-4" />
                Add to My Garden
              </Button>
            </Link>
            <Link
              href={
                identifyResult.database_species_id
                  ? `/database/plants/${identifyResult.database_species_id}`
                  : `/database`
              }
            >
              <Button variant="secondary" className="w-full">
                View in Database
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-400 text-center">
            {identifyResult.source === "ai" ? "Powered by AI Vision" : "Demo result — add OPENAI_API_KEY for live ID"}
          </p>
          {identifyResult.plantnet_second_opinion &&
            identifyResult.plantnet_second_opinion.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pl@ntNet second opinion
                </p>
                {identifyResult.plantnet_second_opinion.slice(0, 3).map((s) => (
                  <div
                    key={s.species}
                    className="flex items-center justify-between text-sm text-gray-700"
                  >
                    <span>
                      {s.commonNames[0] ?? s.species}
                      <span className="block text-xs text-gray-400 italic">{s.species}</span>
                    </span>
                    <Badge variant="outline">{s.score}%</Badge>
                  </div>
                ))}
              </div>
            )}
        </Card>
      )}

      {diagnoseResult && tab === "diagnose" && (
        <Card padding="md" className="page-enter space-y-4 border-amber-100">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-gray-900">Likely diagnosis</h2>
            <Badge variant={diagnoseResult.severity === "serious" ? "danger" : "warning"}>
              {diagnoseResult.severity}
            </Badge>
          </div>
          <p className="font-medium text-gray-900">{diagnoseResult.issue_detected}</p>
          <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
            {diagnoseResult.likely_causes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
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
    </div>
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

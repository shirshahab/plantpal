"use client";

import { useState } from "react";
import { ScanLine, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MultiPhotoCapture,
  photosToRequest,
  type CapturedPhoto,
} from "@/components/scanner/multi-photo-capture";
import { IdentifyPlantResults } from "@/components/scanner/identify-plant-results";
import { BadPhotoGuidance } from "@/components/scanner/bad-photo-guidance";
import { requestIdentifyPlant } from "@/lib/ai/client";
import { assessPhotoQualityClient } from "@/lib/scanner/photo-quality";
import { saveScanToHistory } from "@/lib/scanner/scan-history";
import { useToast } from "@/lib/store/toast-provider";
import { friendlyAiError } from "@/lib/errors/user-messages";
import type { PhotoQualityAssessment, PlantIdentificationResponse } from "@/lib/types/ai";

interface PlantScannerPanelProps {
  embedded?: boolean;
}

export function PlantScannerPanel({ embedded }: PlantScannerPanelProps = {}) {
  const { toast } = useToast();

  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlantIdentificationResponse | null>(null);
  const [clientPhotoQuality, setClientPhotoQuality] = useState<PhotoQualityAssessment | null>(
    null
  );
  const [scanHistoryId, setScanHistoryId] = useState<string | null>(null);

  const preview =
    photos.find((p) => p.role === "whole")?.dataUrl ?? photos[0]?.dataUrl ?? null;

  async function handlePhotosChange(next: CapturedPhoto[]) {
    setPhotos(next);
    setResult(null);
    setScanHistoryId(null);
    if (next.length > 0) {
      const primary = next.find((p) => p.role === "whole") ?? next[0];
      setClientPhotoQuality(await assessPhotoQualityClient(primary.dataUrl));
    } else {
      setClientPhotoQuality(null);
    }
  }

  function clearCapture() {
    setPhotos([]);
    setResult(null);
    setClientPhotoQuality(null);
    setScanHistoryId(null);
  }

  async function runScan() {
    if (photos.length === 0) return;
    setLoading(true);
    setResult(null);
    try {
      const { imageDataUrls, photoRoles } = photosToRequest(photos);
      const res = await requestIdentifyPlant({ imageDataUrls, photoRoles });
      if (!res.ok) throw new Error(res.error);

      const entry = saveScanToHistory({
        photoUrl: preview ?? imageDataUrls[0],
        photoUrls: imageDataUrls,
        result: res.data,
      });
      setScanHistoryId(entry.id);
      setResult(res.data);

      if (res.data.not_fully_confident) {
        toast("Not fully confident — another photo may help");
      } else {
        toast("Plant identified");
      }
    } catch (e) {
      toast(friendlyAiError(e instanceof Error ? e.message : undefined, "identification"));
    } finally {
      setLoading(false);
    }
  }

  const showBadPhoto =
    !result && clientPhotoQuality && !clientPhotoQuality.acceptable && photos.length > 0;

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-8">
      {!embedded && (
        <div className="text-center space-y-2 pt-1">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-green-600 text-white shadow-xl shadow-green-600/30">
            <ScanLine className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Plant Scanner</h1>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Add up to 3 photos — whole plant, leaf, and flower — for the best ID
          </p>
        </div>
      )}

      <MultiPhotoCapture
        photos={photos}
        onChange={handlePhotosChange}
        loading={loading}
        loadingLabel="Analyzing plant with AI…"
        onLimitError={(message) => toast(message)}
      />

      {showBadPhoto && <BadPhotoGuidance quality={clientPhotoQuality} />}

      {loading && (
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

      {!result && (
        <Button
          onClick={runScan}
          disabled={photos.length === 0 || loading}
          loading={loading}
          size="lg"
          className="w-full h-14 text-base touch-manipulation shadow-lg shadow-green-600/20"
        >
          <Camera className="w-5 h-5" />
          Identify Plant
        </Button>
      )}

      {result && !loading && (
        <IdentifyPlantResults
          result={result}
          preview={preview}
          previews={photos.map((p) => p.dataUrl)}
          clientPhotoQuality={clientPhotoQuality}
          scanHistoryId={scanHistoryId}
          onRetake={clearCapture}
        />
      )}
    </div>
  );
}

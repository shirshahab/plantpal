"use client";

import { Camera, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PHOTO_QUALITY_TIPS } from "@/lib/scanner/photo-quality";
import type { PhotoQualityAssessment } from "@/lib/types/ai";

export function BadPhotoGuidance({ quality }: { quality: PhotoQualityAssessment }) {
  if (quality.acceptable) return null;

  return (
    <Card padding="md" className="border-red-200 bg-red-50">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-red-950">
              {quality.message ?? "PlantPal needs a clearer photo."}
            </p>
            {quality.issues.length > 0 && (
              <p className="text-xs text-red-800/90 mt-1 capitalize">
                Detected: {quality.issues.join(", ").replace(/_/g, " ")}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-red-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              Try this
            </p>
            <ul className="space-y-1.5">
              {PHOTO_QUALITY_TIPS.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm text-red-900/90">
                  <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function LowConfidenceGuidance({
  onRetake,
  onSaveUnknown,
}: {
  onRetake: () => void;
  onSaveUnknown: () => void;
}) {
  return (
    <Card padding="md" className="border-amber-200 bg-amber-50">
      <div className="flex gap-3">
        <Camera className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-950">Not fully confident.</p>
          <p className="text-sm text-amber-900/90 leading-relaxed">
            A clearer or additional photo will help PlantPal narrow this down.
          </p>
          <ul className="text-sm text-amber-900/90 space-y-1 list-disc pl-4">
            <li>
              <button type="button" onClick={onRetake} className="underline font-medium">
                Take another photo
              </button>
            </li>
            <li>Add a leaf close-up</li>
            <li>Add a flower or fruit photo</li>
            <li>
              <button type="button" onClick={onSaveUnknown} className="underline font-medium">
                Save as Unknown
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

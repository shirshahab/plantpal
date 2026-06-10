"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  FlipHorizontal2,
  ImageIcon,
  Leaf,
  Flower2,
  TreeDeciduous,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { compressImageFile, compressVideoFrame } from "@/lib/scanner/compress-image";
import {
  SCAN_UPLOAD_LIMIT_LABEL,
  totalDataUrlBytes,
  validatePhotoPayload,
} from "@/lib/scanner/upload-limits";
import { useLiveCamera } from "@/lib/scanner/use-live-camera";
import {
  PhotoCaptureInputs,
  usePhotoCapture,
} from "@/components/scanner/photo-capture-actions";
import type { CapturedPhoto, PhotoRole } from "@/components/scanner/multi-photo-capture";

const SLOTS: {
  role: PhotoRole;
  label: string;
  hint: string;
  icon: React.ElementType;
}[] = [
  {
    role: "whole",
    label: "Whole plant",
    hint: "Full plant in frame",
    icon: TreeDeciduous,
  },
  {
    role: "leaf",
    label: "Leaf close-up",
    hint: "Single leaf detail",
    icon: Leaf,
  },
  {
    role: "flower",
    label: "Flower / fruit",
    hint: "Bloom, fruit, or stem",
    icon: Flower2,
  },
];

type CaptureMode = "live" | "review" | "fallback";

interface LiveCameraScannerProps {
  photos: CapturedPhoto[];
  onChange: (photos: CapturedPhoto[]) => void;
  loading?: boolean;
  loadingLabel?: string;
  onLimitError?: (message: string) => void;
  /** Stop the camera stream when false (e.g. results visible). */
  cameraActive?: boolean;
}

function nextOpenRole(photos: CapturedPhoto[]): PhotoRole {
  for (const slot of SLOTS) {
    if (!photos.some((photo) => photo.role === slot.role)) {
      return slot.role;
    }
  }
  return "flower";
}

function slotIndex(role: PhotoRole): number {
  if (role === "whole") return 0;
  if (role === "leaf") return 1;
  return 2;
}

export function LiveCameraScanner({
  photos,
  onChange,
  loading = false,
  loadingLabel = "Analyzing…",
  onLimitError,
  cameraActive = true,
}: LiveCameraScannerProps) {
  const [activeRole, setActiveRole] = useState<PhotoRole>("whole");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("live");
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const pendingRole = useRef<PhotoRole>("whole");

  const streamEnabled = cameraActive && !loading && captureMode === "live";
  const camera = useLiveCamera({ enabled: streamEnabled });

  const currentSlot =
    SLOTS.find((slot) => slot.role === activeRole) ?? SLOTS[0];

  const preview =
    reviewUrl ??
    photos.find((photo) => photo.role === "whole")?.dataUrl ??
    photos[0]?.dataUrl ??
    null;

  const useFallback = captureMode === "fallback";

  useEffect(() => {
    if (camera.phase === "error" && captureMode === "live") {
      setCaptureMode("fallback");
    }
  }, [camera.phase, captureMode]);

  const ingestDataUrl = useCallback(
    (role: PhotoRole, dataUrl: string) => {
      const next = photos.filter((photo) => photo.role !== role);
      next.push({ role, dataUrl });
      const sorted = next.sort((a, b) => slotIndex(a.role) - slotIndex(b.role));
      const limitError = validatePhotoPayload(sorted.map((photo) => photo.dataUrl));
      if (limitError) {
        onLimitError?.(limitError);
        return false;
      }
      onChange(sorted);
      setActiveRole(nextOpenRole(sorted));
      return true;
    },
    [onChange, onLimitError, photos]
  );

  const ingestFile = useCallback(
    async (file: File) => {
      const dataUrl = await compressImageFile(file);
      const role = pendingRole.current;
      if (ingestDataUrl(role, dataUrl)) {
        setReviewUrl(null);
        setCaptureMode("live");
      }
    },
    [ingestDataUrl]
  );

  const fileCapture = usePhotoCapture(ingestFile);

  const openGalleryForRole = useCallback(
    (role: PhotoRole) => {
      pendingRole.current = role;
      fileCapture.openGallery();
    },
    [fileCapture]
  );

  const handleCapture = useCallback(async () => {
    const video = camera.videoRef.current;
    if (!video || camera.phase !== "live") {
      onLimitError?.("Camera is still starting. Wait a moment and try again.");
      return;
    }

    try {
      const dataUrl = await compressVideoFrame(video);
      setReviewUrl(dataUrl);
      setCaptureMode("review");
      camera.stop();
    } catch (error) {
      onLimitError?.(error instanceof Error ? error.message : "Could not capture photo.");
    }
  }, [camera, onLimitError]);

  const handleRetake = useCallback(() => {
    setReviewUrl(null);
    setCaptureMode("live");
    void camera.restart();
  }, [camera]);

  const handleUsePhoto = useCallback(() => {
    if (!reviewUrl) return;
    if (ingestDataUrl(activeRole, reviewUrl)) {
      setReviewUrl(null);
      setCaptureMode("live");
      void camera.restart();
    }
  }, [activeRole, camera, ingestDataUrl, reviewUrl]);

  function removePhoto(role: PhotoRole) {
    onChange(photos.filter((photo) => photo.role !== role));
    setActiveRole(role);
    setReviewUrl(null);
    setCaptureMode("live");
  }

  function clearAll() {
    onChange([]);
    setActiveRole("whole");
    setReviewUrl(null);
    setCaptureMode("live");
  }

  function selectSlot(role: PhotoRole) {
    setActiveRole(role);
    pendingRole.current = role;
    if (captureMode === "review") {
      setReviewUrl(null);
      setCaptureMode("live");
      void camera.restart();
    }
  }

  const stepNumber = useMemo(() => slotIndex(activeRole) + 1, [activeRole]);

  function retryCamera() {
    setReviewUrl(null);
    setCaptureMode("live");
    void camera.restart();
  }

  return (
    <>
      <Card padding="none" className="overflow-hidden">
        <div className="relative aspect-[4/5] max-h-[420px] bg-gray-950">
          {useFallback ? (
            <FallbackPreview
              preview={preview}
              error={camera.error}
              onOpenGallery={() => openGalleryForRole(activeRole)}
            />
          ) : captureMode === "review" && reviewUrl ? (
            <Image
              src={reviewUrl}
              alt={`Review ${currentSlot.label}`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <>
              <video
                ref={camera.videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />
              {(camera.phase === "starting" || camera.phase === "idle") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                  <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <p className="text-white text-sm font-medium">Starting camera…</p>
                </div>
              )}
            </>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 z-20">
              <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-white font-medium text-sm">{loadingLabel}</p>
            </div>
          )}

          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
            <Badge variant="success" className="text-[10px] bg-black/50 border-white/20 text-white">
              Step {stepNumber}/3 · {currentSlot.label}
            </Badge>
            {!loading && photos.length > 0 && !reviewUrl && (
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium touch-manipulation"
              >
                Clear all
              </button>
            )}
          </div>

          {!useFallback && captureMode === "live" && camera.phase === "live" && !loading && (
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
          )}
        </div>
      </Card>

      {!useFallback && captureMode === "live" && !loading && (
        <div className="flex items-center justify-center gap-4 py-1">
          {camera.canSwitchCamera ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full touch-manipulation"
              onClick={() => void camera.switchCamera()}
              disabled={camera.phase !== "live"}
            >
              <FlipHorizontal2 className="w-4 h-4" />
              Switch camera
            </Button>
          ) : (
            <div className="w-[132px]" aria-hidden />
          )}

          <button
            type="button"
            onClick={() => void handleCapture()}
            disabled={camera.phase !== "live"}
            aria-label={`Capture ${currentSlot.label}`}
            className={cn(
              "w-[72px] h-[72px] rounded-full border-4 border-white bg-green-600 shadow-lg shadow-green-900/40 touch-manipulation",
              "disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
            )}
          />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full touch-manipulation"
            onClick={() => openGalleryForRole(activeRole)}
          >
            <ImageIcon className="w-4 h-4" />
            Upload
          </Button>
        </div>
      )}

      {!useFallback && captureMode === "review" && reviewUrl && !loading && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            className="h-14 touch-manipulation"
            onClick={handleRetake}
          >
            <RotateCcw className="w-5 h-5" />
            Retake
          </Button>
          <Button size="lg" className="h-14 touch-manipulation" onClick={handleUsePhoto}>
            <Check className="w-5 h-5" />
            Use photo
          </Button>
        </div>
      )}

      {useFallback && (
        <div className="space-y-3">
          {camera.error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-950">Camera unavailable</p>
              <p className="text-sm text-amber-900/90 mt-1 leading-relaxed">{camera.error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="h-14 touch-manipulation"
              disabled={loading}
              onClick={() => {
                pendingRole.current = activeRole;
                fileCapture.openCamera();
              }}
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="h-14 touch-manipulation"
              disabled={loading}
              onClick={() => openGalleryForRole(activeRole)}
            >
              <ImageIcon className="w-5 h-5" />
              Upload
            </Button>
          </div>

          {camera.isSupported && (
            <Button
              variant="outline"
              size="sm"
              className="w-full touch-manipulation"
              onClick={retryCamera}
            >
              Try live camera again
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {SLOTS.map((slot) => {
          const captured = photos.find((photo) => photo.role === slot.role);
          const Icon = slot.icon;
          const isActive = activeRole === slot.role;
          return (
            <button
              key={slot.role}
              type="button"
              onClick={() => selectSlot(slot.role)}
              className={cn(
                "relative rounded-xl border-2 overflow-hidden touch-manipulation transition-colors",
                isActive ? "border-green-500 ring-2 ring-green-200" : "border-gray-200",
                captured ? "bg-green-50/50" : "border-dashed bg-gray-50"
              )}
            >
              <div className="aspect-square flex flex-col items-center justify-center p-2 gap-1">
                {captured ? (
                  <>
                    <div className="relative w-full h-full min-h-[72px] rounded-lg overflow-hidden">
                      <Image
                        src={captured.dataUrl}
                        alt={slot.label}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-[10px] font-medium text-green-700 truncate w-full text-center">
                      {slot.label}
                    </span>
                  </>
                ) : (
                  <>
                    <Icon className="w-5 h-5 text-gray-400" />
                    <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">
                      {slot.label}
                    </span>
                    <span className="text-[9px] text-gray-400 text-center leading-tight">
                      {slot.hint}
                    </span>
                  </>
                )}
              </div>
              {captured && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${slot.label ?? slot.role} photo`}
                  onClick={(event) => {
                    event.stopPropagation();
                    removePhoto(slot.role);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.stopPropagation();
                      removePhoto(slot.role);
                    }
                  }}
                  className="absolute top-0.5 right-0.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center touch-manipulation"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <PhotoCaptureInputs capture={fileCapture} />

      <p className="text-xs text-center text-gray-500 leading-relaxed">
        {photos.length > 0 ? (
          <>
            {photos.length} of 3 photos · {SCAN_UPLOAD_LIMIT_LABEL} ·{" "}
            {(totalDataUrlBytes(photos.map((photo) => photo.dataUrl)) / (1024 * 1024)).toFixed(1)}{" "}
            MB used
          </>
        ) : (
          <>
            Capture whole plant, leaf, and flower when available · {SCAN_UPLOAD_LIMIT_LABEL}
          </>
        )}
      </p>
    </>
  );
}

function FallbackPreview({
  preview,
  error,
  onOpenGallery,
}: {
  preview: string | null;
  error: string | null;
  onOpenGallery: () => void;
}) {
  if (preview) {
    return (
      <Image src={preview} alt="Plant capture" fill className="object-cover" unoptimized />
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-24 h-24 rounded-full border-2 border-dashed border-green-400/60 flex items-center justify-center">
        <Camera className="w-10 h-10 text-green-400" />
      </div>
      <p className="text-gray-300 text-sm max-w-[260px] leading-relaxed">
        {error ?? "Live camera unavailable on this device."}
      </p>
      <Button variant="secondary" size="sm" onClick={onOpenGallery}>
        <ImageIcon className="w-4 h-4" />
        Upload from gallery
      </Button>
    </div>
  );
}

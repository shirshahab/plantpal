"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { compressImageFile } from "@/lib/scanner/compress-image";
import { SCAN_UPLOAD_LIMIT_LABEL } from "@/lib/scanner/upload-limits";

interface CameraCaptureProps {
  preview: string | null;
  loading?: boolean;
  loadingLabel?: string;
  onFile: (file: File) => void;
  onClear?: () => void;
  emptyHint?: string;
}

export function CameraCapture({
  preview,
  loading = false,
  loadingLabel = "Analyzing…",
  onFile,
  onClear,
  emptyHint = "Take or upload a photo",
}: CameraCaptureProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    onFile(file);
  }

  return (
    <>
      <Card padding="none" className="overflow-hidden">
        <div className="relative aspect-[4/5] max-h-[380px] bg-gray-900">
          {preview ? (
            <>
              <Image src={preview} alt="Capture" fill className="object-cover" unoptimized />
              {loading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <p className="text-white font-medium text-sm">{loadingLabel}</p>
                </div>
              )}
              {onClear && !loading && (
                <button
                  type="button"
                  onClick={onClear}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium touch-manipulation"
                >
                  Retake
                </button>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-green-400/60 flex items-center justify-center">
                <Camera className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-gray-400 text-sm text-center max-w-[220px]">{emptyHint}</p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          className="h-16 text-base touch-manipulation shadow-lg shadow-green-600/20"
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="w-6 h-6" />
          Take Photo
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="h-14 touch-manipulation"
          onClick={() => galleryRef.current?.click()}
        >
          <ImageIcon className="w-5 h-5" />
          Upload
        </Button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <p className="text-xs text-center text-gray-500">{SCAN_UPLOAD_LIMIT_LABEL}</p>
    </>
  );
}

export function fileToDataUrl(file: File): Promise<string> {
  return compressImageFile(file);
}

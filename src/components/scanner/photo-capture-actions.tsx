"use client";

import { useCallback, useRef } from "react";
import { Camera, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotoCaptureActionsProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  takePhotoClassName?: string;
  uploadClassName?: string;
}

export function usePhotoCapture(onFile: (file: File) => void) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const openCamera = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const openGallery = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  const onCameraInputChange = useCallback(
    (file: File | undefined) => {
      if (file) onFile(file);
    },
    [onFile]
  );

  const onGalleryInputChange = useCallback(
    (file: File | undefined) => {
      if (file) onFile(file);
    },
    [onFile]
  );

  return {
    openCamera,
    openGallery,
    onCameraInputChange,
    onGalleryInputChange,
    cameraInputRef,
    galleryInputRef,
  };
}

export function PhotoCaptureActions({
  onFile,
  disabled = false,
  takePhotoClassName,
  uploadClassName,
}: PhotoCaptureActionsProps) {
  const capture = usePhotoCapture(onFile);

  return (
    <>
      <PhotoCaptureInputs capture={capture} />

      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          disabled={disabled}
          className={cn(
            "h-16 text-base touch-manipulation shadow-lg shadow-green-600/20",
            takePhotoClassName
          )}
          onClick={capture.openCamera}
        >
          <Camera className="w-6 h-6" />
          Take Photo
        </Button>
        <Button
          variant="secondary"
          size="lg"
          disabled={disabled}
          className={cn("h-14 touch-manipulation", uploadClassName)}
          onClick={capture.openGallery}
        >
          <ImageIcon className="w-5 h-5" />
          Upload
        </Button>
      </div>

      <CameraFallbackHint />
    </>
  );
}

/** Hidden camera + gallery inputs for custom button layouts (e.g. multi-photo identify). */
export function PhotoCaptureInputs({
  capture,
}: {
  capture: ReturnType<typeof usePhotoCapture>;
}) {
  return (
    <>
      {/* Take Photo — rear camera when the browser supports capture=environment */}
      <input
        ref={capture.cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden
        onChange={(e) => {
          capture.onCameraInputChange(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {/* Upload — gallery only, no capture attribute */}
      <input
        ref={capture.galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={(e) => {
          capture.onGalleryInputChange(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

    </>
  );
}

export function CameraFallbackHint() {
  return (
    <p className="text-xs text-center text-gray-400 leading-relaxed">
      Camera unavailable. Choose a photo instead with Upload.
    </p>
  );
}

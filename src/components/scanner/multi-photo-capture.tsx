"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera, ImageIcon, X, Leaf, Flower2, TreeDeciduous } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fileToDataUrl } from "@/components/scanner/camera-capture";

export type PhotoRole = "whole" | "leaf" | "flower";

export interface CapturedPhoto {
  role: PhotoRole;
  dataUrl: string;
}

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

interface MultiPhotoCaptureProps {
  photos: CapturedPhoto[];
  onChange: (photos: CapturedPhoto[]) => void;
  loading?: boolean;
  loadingLabel?: string;
  activePreview?: string | null;
}

export function MultiPhotoCapture({
  photos,
  onChange,
  loading = false,
  loadingLabel = "Analyzing…",
  activePreview,
}: MultiPhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRole = useRef<PhotoRole>("whole");

  const preview =
    activePreview ??
    photos.find((p) => p.role === "whole")?.dataUrl ??
    photos[0]?.dataUrl ??
    null;

  function openPicker(role: PhotoRole) {
    pendingRole.current = role;
    inputRef.current?.click();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const role = pendingRole.current;
    const next = photos.filter((p) => p.role !== role);
    next.push({ role, dataUrl });
    onChange(next.sort((a, b) => slotIndex(a.role) - slotIndex(b.role)));
  }

  function removePhoto(role: PhotoRole) {
    onChange(photos.filter((p) => p.role !== role));
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <>
      <Card padding="none" className="overflow-hidden">
        <div className="relative aspect-[4/5] max-h-[380px] bg-gray-900">
          {preview ? (
            <>
              <Image src={preview} alt="Plant capture" fill className="object-cover" unoptimized />
              {loading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <p className="text-white font-medium text-sm">{loadingLabel}</p>
                </div>
              )}
              {!loading && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium touch-manipulation"
                >
                  Clear all
                </button>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-green-400/60 flex items-center justify-center">
                <Camera className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-gray-400 text-sm text-center max-w-[240px]">
                Add up to 3 photos — whole plant, leaf, and flower or fruit — in natural light
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {SLOTS.map((slot) => {
          const captured = photos.find((p) => p.role === slot.role);
          const Icon = slot.icon;
          return (
            <button
              key={slot.role}
              type="button"
              onClick={() => openPicker(slot.role)}
              className={cn(
                "relative rounded-xl border-2 overflow-hidden touch-manipulation transition-colors",
                captured ? "border-green-300 bg-green-50/50" : "border-dashed border-gray-200 bg-gray-50"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(slot.role);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      removePhoto(slot.role);
                    }
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          className="h-14 touch-manipulation"
          onClick={() => openPicker(photos.length ? photos[0].role : "whole")}
        >
          <Camera className="w-5 h-5" />
          Take Photo
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="h-14 touch-manipulation"
          onClick={() => openPicker(photos.length ? photos[photos.length - 1].role : "whole")}
        >
          <ImageIcon className="w-5 h-5" />
          Upload
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {photos.length > 0 && (
        <p className="text-xs text-center text-gray-500">
          {photos.length} of 3 photos added
          {photos.length < 3 && " — add leaf or flower shots for better accuracy"}
        </p>
      )}
    </>
  );
}

function slotIndex(role: PhotoRole): number {
  if (role === "whole") return 0;
  if (role === "leaf") return 1;
  return 2;
}

export function photosToRequest(photos: CapturedPhoto[]): {
  imageDataUrls: string[];
  photoRoles: PhotoRole[];
} {
  return {
    imageDataUrls: photos.map((p) => p.dataUrl),
    photoRoles: photos.map((p) => p.role),
  };
}

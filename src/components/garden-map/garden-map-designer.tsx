"use client";

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlantPlacementCard } from "@/components/moat/plant-placement-card";
import { useMoat } from "@/lib/store/moat-provider";
import { GARDEN_SPACE_ICONS } from "@/lib/moat/garden-map-types";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function GardenMapDesigner() {
  const searchParams = useSearchParams();
  const spaceId = searchParams.get("space");
  const { ready, spaces, updateSpace, addSpaceZone, addSpacePlacement } = useMoat();
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const space = spaces.find((s) => s.id === spaceId) ?? spaces[0];
  const [zoneName, setZoneName] = useState("New Zone");
  const [plantLabel, setPlantLabel] = useState("");

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!space || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      addSpaceZone(space.id, {
        name: zoneName,
        x: Math.max(0, x - 0.12),
        y: Math.max(0, y - 0.1),
        width: 0.24,
        height: 0.2,
        sunExposure: "full_sun",
        shadeHours: 2,
      });
    },
    [space, zoneName, addSpaceZone]
  );

  async function handlePhoto(file: File) {
    if (!space) return;
    const url = await readFileAsDataUrl(file);
    updateSpace(space.id, { photoUrl: url });
  }

  function handleAddPlant() {
    if (!space || !plantLabel.trim()) return;
    const zone = space.zones[0];
    addSpacePlacement(space.id, {
      zoneId: zone?.id ?? "unzoned",
      plantId: null,
      label: plantLabel.trim(),
      sunExposure: "partial_sun",
      waterSchedule: "When top inch dry",
      fertilizerSchedule: "Balanced monthly",
      healthScore: 85,
      x: 0.3 + Math.random() * 0.4,
      y: 0.3 + Math.random() * 0.3,
    });
    setPlantLabel("");
  }

  if (!ready || !space) {
    return (
      <div className="max-w-lg mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded-lg w-1/2" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto page-enter">
      <PageHeader
        title={space.name}
        description="Tap the map to draw zones · drag plants in list"
        action={
          <Link href="/garden-map">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        }
      />

      <Card padding="none" className="overflow-hidden">
        <div
          ref={canvasRef}
          role="presentation"
          onClick={handleMapClick}
          className="relative aspect-[4/3] bg-gradient-to-br from-green-100 to-emerald-50 cursor-crosshair touch-manipulation"
          style={
            space.photoUrl
              ? {
                  backgroundImage: `url(${space.photoUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {!space.photoUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-2">{GARDEN_SPACE_ICONS[space.type]}</span>
              <p className="text-sm">Upload a photo or tap to add zones</p>
            </div>
          )}
          {space.zones.map((zone) => (
            <div
              key={zone.id}
              className="absolute border-2 border-green-500/80 bg-green-400/20 rounded-lg backdrop-blur-[1px]"
              style={{
                left: `${zone.x * 100}%`,
                top: `${zone.y * 100}%`,
                width: `${zone.width * 100}%`,
                height: `${zone.height * 100}%`,
              }}
            >
              <span className="absolute -top-5 left-0 text-[10px] font-bold text-green-700 bg-white/90 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                {zone.name}
              </span>
            </div>
          ))}
          {space.placements.map((p) => (
            <div
              key={p.id}
              className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-white shadow-md border-2 border-green-500 flex items-center justify-center text-sm"
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
              title={p.label}
            >
              🌿
            </div>
          ))}
        </div>
        <div className="p-3 flex gap-2 border-t border-gray-50">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handlePhoto(f);
            }}
          />
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" />
            Upload photo
          </Button>
        </div>
      </Card>

      <Card padding="md">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Add zone
        </p>
        <div className="flex gap-2">
          <input
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Zone name"
          />
          <p className="text-xs text-gray-400 self-center shrink-0">Tap map</p>
        </div>
      </Card>

      <Card padding="md">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Add plant
        </p>
        <div className="flex gap-2">
          <input
            value={plantLabel}
            onChange={(e) => setPlantLabel(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="e.g. West Fence Lemon Tree"
          />
          <Button size="sm" onClick={handleAddPlant}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {space.placements.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            Plants in this space
          </p>
          {space.placements.map((p) => (
            <PlantPlacementCard key={p.id} placement={p} />
          ))}
        </div>
      )}
    </div>
  );
}

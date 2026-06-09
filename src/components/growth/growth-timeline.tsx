"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Plus, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Plant } from "@/lib/types";
import { useEngagement } from "@/lib/store/engagement-provider";
import { useGenome } from "@/lib/store/genome-provider";
import { daysSincePlantStart } from "@/lib/mock/growth";
import { formatDate } from "@/lib/utils";

export function GrowthTimeline({ plant }: { plant: Plant }) {
  const { getGrowthForPlant, addGrowthEntry } = useEngagement();
  const { recordEvent } = useGenome();
  const entries = getGrowthForPlant(plant.id);
  const [note, setNote] = useState("");
  const [height, setHeight] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleAdd() {
    addGrowthEntry({
      plantId: plant.id,
      photoUrl: preview ?? plant.image,
      heightInches: height ? Number(height) : null,
      note: note.trim() || "Progress photo",
      entryDate: new Date().toISOString(),
    });
    recordEvent(plant.id, "growth_measurement", {
      heightInches: height ? Number(height) : null,
      note: note.trim() || "Progress photo",
    });
    setNote("");
    setHeight("");
    setPreview(null);
  }

  const heights = entries.filter((e) => e.heightInches).map((e) => e.heightInches!);
  const growthDelta =
    heights.length >= 2 ? heights[0] - heights[heights.length - 1] : null;

  return (
    <Card id="growth">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Growth Timeline</h2>
        </div>
        {growthDelta !== null && growthDelta > 0 && (
          <p className="text-sm text-green-600 mt-1">+{growthDelta}&quot; growth tracked</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Camera className="w-4 h-4" />
            Upload photo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0])}
          />
        </div>

        {preview && (
          <div className="relative h-32 w-full rounded-xl overflow-hidden bg-green-50">
            <Image src={preview} alt="New entry" fill className="object-cover" unoptimized />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Height (inches)"
            placeholder="Optional"
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
          <Input
            label="Note"
            placeholder="What's changed?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <Button size="sm" onClick={handleAdd} className="touch-manipulation">
          <Plus className="w-4 h-4" />
          Add timeline entry
        </Button>

        <div className="space-y-4 pt-2">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No progress photos yet. Snap your first one today!
            </p>
          ) : (
            entries.map((entry) => {
              const day = daysSincePlantStart(plant.createdAt, entry.entryDate);
              return (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="w-px flex-1 bg-green-100 min-h-[60px]" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-xs font-semibold text-green-600">Day {day}</p>
                    <p className="text-xs text-gray-400">{formatDate(entry.entryDate)}</p>
                    <div className="relative h-24 w-full rounded-lg overflow-hidden mt-2 bg-green-50">
                      <Image
                        src={entry.photoUrl}
                        alt={`Day ${day}`}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                    {entry.heightInches && (
                      <p className="text-xs text-gray-500 mt-1">{entry.heightInches}&quot; tall</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

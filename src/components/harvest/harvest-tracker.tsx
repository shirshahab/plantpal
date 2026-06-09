"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Plant } from "@/lib/types";
import { useEngagement } from "@/lib/store/engagement-provider";
import { formatDate } from "@/lib/utils";

export function HarvestTracker({ plant }: { plant: Plant }) {
  const { harvestEntries, addHarvestEntry } = useEngagement();
  const entries = harvestEntries.filter((e) => e.plantId === plant.id);
  const [crop, setCrop] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");

  function handleLog() {
    if (!crop.trim() || !qty) return;
    addHarvestEntry({
      plantId: plant.id,
      cropName: crop.trim(),
      quantity: Number(qty),
      unit: unit.trim() || "items",
      harvestDate: new Date().toISOString(),
      notes: notes.trim(),
    });
    setCrop("");
    setQty("");
    setUnit("");
    setNotes("");
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Harvest Tracker</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Input label="Crop" placeholder="Lemons" value={crop} onChange={(e) => setCrop(e.target.value)} />
          <Input label="Qty" placeholder="12" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          <Input label="Unit" placeholder="lemons" value={unit} onChange={(e) => setUnit(e.target.value)} />
          <Input label="Notes" placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button size="sm" onClick={handleLog} className="touch-manipulation">
          <Plus className="w-4 h-4" />
          Log harvest
        </Button>

        {entries.length > 0 && (
          <div className="space-y-2 pt-2">
            {entries.map((e) => (
              <div key={e.id} className="flex justify-between text-sm p-3 rounded-xl bg-emerald-50/80">
                <span className="font-medium text-gray-900">
                  {e.quantity} {e.unit} {e.cropName}
                </span>
                <span className="text-gray-400 text-xs">{formatDate(e.harvestDate)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

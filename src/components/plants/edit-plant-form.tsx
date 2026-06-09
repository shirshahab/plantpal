"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PlantImage, PlaceholderPickerCard } from "@/components/plants/plant-image";
import {
  PlantSizeFieldsForm,
  parseSizeFormValues,
  sizeFormFromPlant,
} from "@/components/plants/plant-size-fields";
import { GoalPicker } from "@/components/journey/goal-picker";
import { usePlants } from "@/lib/store/plants-provider";
import { useJourney } from "@/lib/store/journey-provider";
import { useToast } from "@/lib/store/toast-provider";
import { friendlySaveError } from "@/lib/errors/user-messages";
import type { Plant } from "@/lib/types";
import {
  LOCATION_TYPE_LABELS,
  PLANTING_TYPE_LABELS,
  SUN_EXPOSURE_LABELS,
} from "@/lib/types";
import type { PhotoStatus, PlaceholderImageType } from "@/lib/plants/plant-size";
import { PLACEHOLDER_OPTIONS } from "@/lib/plants/plant-size";
import { cn } from "@/lib/utils";

export function EditPlantForm({ plant }: { plant: Plant }) {
  const router = useRouter();
  const { updatePlant } = usePlants();
  const { getPlantGoals, updatePlantGoals } = useJourney();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const existingGoals = getPlantGoals(plant.id);
  const [goalIds, setGoalIds] = useState(existingGoals.map((g) => g.id));
  const [primaryGoalId, setPrimaryGoalId] = useState<string | null>(
    existingGoals[0]?.id ?? null
  );
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoStatus, setPhotoStatus] = useState<PhotoStatus>(plant.photoStatus);
  const [placeholderType, setPlaceholderType] = useState<PlaceholderImageType | null>(
    plant.placeholderImageType
  );

  const [form, setForm] = useState({
    name: plant.name,
    species: plant.species,
    zipCode: plant.zipCode,
    locationType: plant.locationType,
    plantingType: plant.plantingType,
    sunExposure: plant.sunExposure,
    healthNotes: plant.healthNotes,
  });
  const [sizeForm, setSizeForm] = useState(sizeFormFromPlant(plant));

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handlePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoFile(file);
    setPhotoStatus("real_photo");
    setPlaceholderType(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setLoading(true);
    try {
      const size = parseSizeFormValues(sizeForm);
      await updatePlant(
        plant.id,
        {
          name: form.name,
          species: form.species,
          zipCode: form.zipCode,
          locationType: form.locationType,
          plantingType: form.plantingType,
          sunExposure: form.sunExposure,
          healthNotes: form.healthNotes,
          photoStatus,
          placeholderImageType: placeholderType,
          ...size,
        },
        photoFile
      );
      updatePlantGoals(plant, goalIds, primaryGoalId ?? goalIds[0]);
      toast("Plant updated.");
      router.push(`/plants/${plant.id}`);
    } catch (e) {
      toast(friendlySaveError(e instanceof Error ? e.message : "Update failed"));
      setLoading(false);
    }
  }

  const displayPlant: Plant = {
    ...plant,
    ...form,
    image: preview ?? plant.image,
    photoStatus,
    placeholderImageType: placeholderType,
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <Link
        href={`/plants/${plant.id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to plant
      </Link>

      <PageHeader title="Edit Plant" description={plant.name} />

      <Card padding="md" className="space-y-4">
        <PlantImage plant={displayPlant} className="h-40 rounded-xl" showBadge />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Camera className="w-4 h-4" />
            Change photo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0])}
          />
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase">Or use placeholder</p>
        <div className="grid grid-cols-3 gap-2">
          {PLACEHOLDER_OPTIONS.map((opt) => (
            <PlaceholderPickerCard
              key={opt.id}
              type={opt.id}
              selected={placeholderType === opt.id}
              onSelect={() => {
                setPlaceholderType(opt.id);
                setPhotoStatus("placeholder");
                setPhotoFile(null);
                setPreview(null);
              }}
            />
          ))}
        </div>

        <Input id="name" name="name" label="Nickname" value={form.name} onChange={handleChange} />
        <Input
          id="species"
          name="species"
          label="Species"
          value={form.species}
          onChange={handleChange}
        />
        <Input
          id="zipCode"
          name="zipCode"
          label="ZIP code"
          value={form.zipCode}
          onChange={handleChange}
        />

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Location</p>
          <div className="grid grid-cols-2 gap-2">
            {(["indoor", "outdoor"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm((p) => ({ ...p, locationType: v }))}
                className={cn(
                  "rounded-xl border-2 py-2 text-sm font-medium",
                  form.locationType === v
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200"
                )}
              >
                {LOCATION_TYPE_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Planting</p>
          <div className="grid grid-cols-2 gap-2">
            {(["pot", "ground"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm((p) => ({ ...p, plantingType: v }))}
                className={cn(
                  "rounded-xl border-2 py-2 text-sm font-medium",
                  form.plantingType === v
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200"
                )}
              >
                {PLANTING_TYPE_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Sun</p>
          <div className="space-y-2">
            {(["full_sun", "partial_sun", "shade"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm((p) => ({ ...p, sunExposure: v }))}
                className={cn(
                  "w-full rounded-xl border-2 py-2 text-sm font-medium text-left px-4",
                  form.sunExposure === v
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200"
                )}
              >
                {SUN_EXPOSURE_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="healthNotes" className="text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="healthNotes"
            name="healthNotes"
            rows={3}
            value={form.healthNotes}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </Card>

      <Card padding="md">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Size & purchase</h2>
        <PlantSizeFieldsForm values={sizeForm} onChange={setSizeForm} />
      </Card>

      <Card padding="md">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Goals</h2>
        <GoalPicker
          selectedIds={goalIds}
          primaryId={primaryGoalId}
          onChange={(ids, primary) => {
            setGoalIds(ids);
            setPrimaryGoalId(primary);
          }}
          compact
        />
      </Card>

      <Button size="lg" className="w-full" loading={loading} onClick={() => void handleSave()}>
        Save changes
      </Button>
    </div>
  );
}

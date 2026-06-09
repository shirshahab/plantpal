"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SpeciesSearchPanel } from "@/components/knowledge/species-search";
import { usePlants } from "@/lib/store/plants-provider";
import { useToast } from "@/lib/store/toast-provider";
import { friendlySaveError } from "@/lib/errors/user-messages";
import { DEFAULT_PLANT_IMAGE } from "@/lib/plants";
import { getPlantSpeciesById } from "@/lib/knowledge";
import type { LocationType, PlantingType, SunExposure } from "@/lib/types";
import {
  LOCATION_TYPE_LABELS,
  PLANTING_TYPE_LABELS,
  SUN_EXPOSURE_LABELS,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { LocalMatchCheck } from "@/components/climate/local-match-check";
import { GoalPicker } from "@/components/journey/goal-picker";
import { useJourney } from "@/lib/store/journey-provider";
import { getGoalsByIds } from "@/lib/mock/plant-goals";

const STEPS = [
  "Species",
  "Photo",
  "Details",
  "Location",
  "Placement",
  "Climate",
  "Sunlight",
  "Goals",
  "Review",
];

const TAG_PREFILL_KEY = "plantpal-tag-prefill";

export function AddPlantWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addPlant } = usePlants();
  const { initPlantJourney } = useJourney();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [speciesImage, setSpeciesImage] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [goalIds, setGoalIds] = useState<string[]>([]);
  const [primaryGoalId, setPrimaryGoalId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    species: "",
    locationType: "indoor" as LocationType,
    plantingType: "pot" as PlantingType,
    zipCode: "",
    sunExposure: "partial_sun" as SunExposure,
  });

  useEffect(() => {
    const id = searchParams.get("speciesId");
    const name = searchParams.get("name");
    const species = searchParams.get("species");
    const locationType = searchParams.get("locationType") as LocationType | null;
    const sunExposure = searchParams.get("sunExposure") as SunExposure | null;
    const fromTag = searchParams.get("from") === "tag";

    if (fromTag) {
      try {
        const raw = sessionStorage.getItem(TAG_PREFILL_KEY);
        if (raw) {
          const tag = JSON.parse(raw) as {
            plant_name: string;
            scientific_name: string | null;
            suggested_location: string | null;
            suggested_sun_exposure: SunExposure | null;
            imageDataUrl?: string;
          };
          setForm((p) => ({
            ...p,
            name: tag.plant_name || p.name,
            species: tag.scientific_name || p.species,
            locationType:
              tag.suggested_location === "indoor" || tag.suggested_location === "outdoor"
                ? tag.suggested_location
                : p.locationType,
            sunExposure: tag.suggested_sun_exposure ?? p.sunExposure,
          }));
          if (tag.imageDataUrl) {
            setPreview(tag.imageDataUrl);
          }
          setManualEntry(true);
          setStep(2);
          sessionStorage.removeItem(TAG_PREFILL_KEY);
        }
      } catch {
        /* ignore */
      }
    }

    if (name || species) {
      setForm((p) => ({
        ...p,
        name: name || p.name,
        species: species || p.species,
        locationType: locationType === "indoor" || locationType === "outdoor" ? locationType : p.locationType,
        sunExposure:
          sunExposure === "full_sun" ||
          sunExposure === "partial_sun" ||
          sunExposure === "shade"
            ? sunExposure
            : p.sunExposure,
      }));
      if (name || species) {
        setManualEntry(true);
        setStep(2);
      }
    }

    if (id) {
      const found = getPlantSpeciesById(id);
      if (found) {
        setSpeciesId(id);
        setSpeciesImage(found.image_url);
        setForm((p) => ({
          ...p,
          name: name || found.common_name,
          species: found.scientific_name,
          locationType: found.type === "indoor" || found.type === "succulent" ? "indoor" : p.locationType,
        }));
        setStep(1);
      }
    }
  }, [searchParams]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handlePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSpeciesSelect(
    id: string,
    commonName: string,
    scientificName: string,
    imageUrl: string
  ) {
    setSpeciesId(id);
    setSpeciesImage(imageUrl);
    setManualEntry(false);
    setForm((p) => ({
      ...p,
      name: commonName,
      species: scientificName,
    }));
    setStep(1);
  }

  function canContinue() {
    switch (step) {
      case 0:
        return manualEntry ? form.species.trim().length > 0 : !!speciesId;
      case 2:
        return form.name.trim() && form.species.trim();
      case 5:
        return form.zipCode.trim().length >= 5;
      case 7:
        return goalIds.length > 0;
      default:
        return true;
    }
  }

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      const image =
        preview || speciesImage || DEFAULT_PLANT_IMAGE;
      const plant = await addPlant(
        {
          ...form,
          image,
          goalIds,
          primaryGoalId: primaryGoalId ?? goalIds[0],
        },
        photoFile
      );
      initPlantJourney(plant, goalIds, primaryGoalId ?? goalIds[0]);
      toast("Plant added to your garden.");
      router.push(`/plants/${plant.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? friendlySaveError(err.message) : friendlySaveError("Failed to add plant")
      );
      setLoading(false);
    }
  }

  const displayImage = preview || speciesImage;

  return (
    <div className="max-w-lg mx-auto pb-28 md:pb-8">
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{STEPS[step]}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="page-enter min-h-[360px]">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Find your plant</h2>
            <p className="text-sm text-gray-500">
              Search the PlantPal database first — we&apos;ll pre-fill species and care info.
            </p>
            {speciesId && !manualEntry && (
              <Card padding="md" className="bg-green-50 border-green-100">
                <p className="text-sm font-medium text-green-800">{form.name}</p>
                <p className="text-xs text-green-600 italic">{form.species}</p>
              </Card>
            )}
            <SpeciesSearchPanel compact onSelect={handleSpeciesSelect} />
            <Button
              variant="ghost"
              className="w-full touch-manipulation"
              onClick={() => {
                setManualEntry(true);
                setSpeciesId(null);
                setSpeciesImage(null);
              }}
            >
              Enter species manually
            </Button>
            {manualEntry && (
              <Input
                id="species"
                name="species"
                label="Species (manual)"
                placeholder="Citrus × meyeri"
                value={form.species}
                onChange={handleChange}
                className="text-base py-3"
              />
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Plant photo</h2>
            <p className="text-sm text-gray-500">
              Add your own photo or use the database image. Optional — you can skip.
            </p>
            <Card
              padding="none"
              className="overflow-hidden cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <div className="relative h-56 bg-green-50">
                {displayImage ? (
                  <Image src={displayImage} alt="Preview" fill className="object-cover" unoptimized={!!preview} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Upload className="w-10 h-10 text-green-400" />
                    <span className="text-sm text-gray-500">Tap to add photo</span>
                  </div>
                )}
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" className="h-12 touch-manipulation" onClick={() => cameraRef.current?.click()}>
                <Camera className="w-5 h-5" />
                Camera
              </Button>
              <Button variant="outline" className="h-12 touch-manipulation" onClick={() => fileRef.current?.click()}>
                <Upload className="w-5 h-5" />
                Gallery
              </Button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Nickname</h2>
            <Input id="name" name="name" label="Plant nickname" placeholder="My Meyer Lemon" value={form.name} onChange={handleChange} className="text-base py-3" />
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Species: </span>
              {form.species}
            </div>
            {manualEntry && (
              <Input id="species" name="species" label="Species" placeholder="Citrus × meyeri" value={form.species} onChange={handleChange} className="text-base py-3" />
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Indoor or outdoor?</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["indoor", "outdoor"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, locationType: v }))}
                  className={cn(
                    "h-24 rounded-2xl border-2 text-base font-medium transition-all touch-manipulation",
                    form.locationType === v ? "border-green-600 bg-green-50 text-green-800" : "border-gray-200 text-gray-600"
                  )}
                >
                  {LOCATION_TYPE_LABELS[v]}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Pot or ground?</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["pot", "ground"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, plantingType: v }))}
                  className={cn(
                    "h-24 rounded-2xl border-2 text-base font-medium transition-all touch-manipulation",
                    form.plantingType === v ? "border-green-600 bg-green-50 text-green-800" : "border-gray-200 text-gray-600"
                  )}
                >
                  {PLANTING_TYPE_LABELS[v]}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Your ZIP code</h2>
            <p className="text-sm text-gray-500">We use this for climate-based care tips.</p>
            <Input id="zipCode" name="zipCode" label="ZIP code" placeholder="91101" inputMode="numeric" value={form.zipCode} onChange={handleChange} className="text-base py-3 text-lg tracking-wide" />
            <LocalMatchCheck
              name={form.name}
              species={form.species}
              zipCode={form.zipCode}
              locationType={form.locationType}
              plantingType={form.plantingType}
              sunExposure={form.sunExposure}
            />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Sun exposure</h2>
            <div className="space-y-3">
              {(["full_sun", "partial_sun", "shade"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, sunExposure: v }))}
                  className={cn(
                    "w-full h-14 rounded-2xl border-2 text-base font-medium transition-all touch-manipulation px-4 text-left",
                    form.sunExposure === v ? "border-green-600 bg-green-50 text-green-800" : "border-gray-200 text-gray-600"
                  )}
                >
                  {SUN_EXPOSURE_LABELS[v]}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              What is your goal for this plant?
            </h2>
            <p className="text-sm text-gray-500">
              Pick one or more — your care plan adapts to what you&apos;re trying to achieve.
            </p>
            <GoalPicker
              selectedIds={goalIds}
              primaryId={primaryGoalId}
              onChange={(ids, primary) => {
                setGoalIds(ids);
                setPrimaryGoalId(primary);
              }}
              compact
            />
          </div>
        )}

        {step === 8 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Review & save</h2>
            <Card padding="md" className="space-y-3 text-sm">
              {displayImage && (
                <div className="relative h-32 rounded-xl overflow-hidden mb-3">
                  <Image src={displayImage} alt="Preview" fill className="object-cover" unoptimized={!!preview} />
                </div>
              )}
              <Row label="Name" value={form.name} />
              <Row label="Species" value={form.species} />
              <Row label="Location" value={LOCATION_TYPE_LABELS[form.locationType]} />
              <Row label="Planting" value={PLANTING_TYPE_LABELS[form.plantingType]} />
              <Row label="ZIP" value={form.zipCode} />
              <Row label="Sun" value={SUN_EXPOSURE_LABELS[form.sunExposure]} />
              <Row
                label="Goals"
                value={getGoalsByIds(goalIds)
                  .map((g) => g.name)
                  .join(", ")}
              />
            </Card>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl whitespace-pre-wrap">{error}</div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="outline" size="lg" className="h-14 flex-1 touch-manipulation" onClick={() => setStep((s) => s - 1)} disabled={loading}>
            <ChevronLeft className="w-5 h-5" />
            Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button size="lg" className="h-14 flex-1 touch-manipulation" disabled={!canContinue()} onClick={() => setStep((s) => s + 1)}>
            Continue
            <ChevronRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button size="lg" className="h-14 flex-1 touch-manipulation" loading={loading} onClick={handleSave}>
            <Check className="w-5 h-5" />
            Save Plant
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Search,
  PenLine,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SpeciesSearchPanel } from "@/components/knowledge/species-search";
import { usePlants } from "@/lib/store/plants-provider";
import { useSubscription } from "@/lib/store/subscription-provider";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { useUpgradeModal } from "@/components/billing/upgrade-modal-provider";
import { UPGRADE_COPY } from "@/lib/subscription/types";
import { useToast } from "@/lib/store/toast-provider";
import { friendlySaveError } from "@/lib/errors/user-messages";
import { DEFAULT_PLANT_IMAGE } from "@/lib/plants";
import { getPlantSpeciesById } from "@/lib/knowledge";
import { loadUserProfile, markFirstPlantAdded } from "@/lib/profile/user-profile";
import { trackEvent } from "@/lib/analytics/track";
import type { LocationType, PlantingType, SunExposure } from "@/lib/types";
import {
  LOCATION_TYPE_LABELS,
  PLANTING_TYPE_LABELS,
  SUN_EXPOSURE_LABELS,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { LocalMatchCheck } from "@/components/climate/local-match-check";
import { GoalPicker } from "@/components/journey/goal-picker";
import { PlaceholderPickerCard, getPreviewImageUrl } from "@/components/plants/plant-image";
import {
  PlantSizeFieldsForm,
  parseSizeFormValues,
  EMPTY_SIZE_FORM,
} from "@/components/plants/plant-size-fields";
import { useJourney } from "@/lib/store/journey-provider";
import { getGoalsByIds } from "@/lib/mock/plant-goals";
import {
  inferPlaceholderType,
  PLACEHOLDER_OPTIONS,
  type PhotoStatus,
  type PlaceholderImageType,
} from "@/lib/plants/plant-size";
import { getPlaceholderImageUrl } from "@/lib/plants/plant-placeholders";

const STEPS = ["Get started", "Plant", "Photo", "Details", "Goals"];
const DEFAULT_GOAL_ID = "keep-it-alive";

type EntryMode = "search" | "manual" | null;

const TAG_PREFILL_KEY = "plantpal-tag-prefill";
const SCAN_PREFILL_KEY = "plantpal-scan-prefill";

export function AddPlantWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { plants, addPlant } = usePlants();
  const { canAddPlant, plantLimit, plantCount, betaUnlockAll } = useSubscription();
  const { showUpgradeModal } = useUpgradeModal();
  const { initPlantJourney } = useJourney();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [entryMode, setEntryMode] = useState<EntryMode>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [speciesImage, setSpeciesImage] = useState<string | null>(null);
  const [goalIds, setGoalIds] = useState<string[]>([DEFAULT_GOAL_ID]);
  const [primaryGoalId, setPrimaryGoalId] = useState<string | null>(DEFAULT_GOAL_ID);
  const [photoStatus, setPhotoStatus] = useState<PhotoStatus>("needs_photo");
  const [placeholderType, setPlaceholderType] = useState<PlaceholderImageType | null>(null);
  const [addPhotoLater, setAddPhotoLater] = useState(false);
  const [fromScanPhoto, setFromScanPhoto] = useState(false);
  const [sizeForm, setSizeForm] = useState(EMPTY_SIZE_FORM);
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

  const atPlantLimit = !canAddPlant() && !betaUnlockAll;
  const isFirstPlantFlow = searchParams.get("first") === "1" || plants.length === 0;

  useEffect(() => {
    const profile = loadUserProfile();
    if (profile.zipCode) {
      setForm((p) => ({ ...p, zipCode: profile.zipCode }));
    }
  }, []);

  useEffect(() => {
    const id = searchParams.get("speciesId");
    const name = searchParams.get("name");
    const species = searchParams.get("species");
    const locationType = searchParams.get("locationType") as LocationType | null;
    const sunExposure = searchParams.get("sunExposure") as SunExposure | null;
    const fromTag = searchParams.get("from") === "tag";
    const fromScan = searchParams.get("from") === "scan";
    const unknownScan = searchParams.get("unknown") === "1";

    if (fromScan) {
      try {
        const raw = sessionStorage.getItem(SCAN_PREFILL_KEY);
        if (raw) {
          const scan = JSON.parse(raw) as {
            common_name: string;
            scientific_name: string;
            suggested_location?: string;
            suggested_sun?: SunExposure;
            imageDataUrl?: string;
            unknown?: boolean;
            database_species_id?: string | null;
          };
          const isUnknown = unknownScan || scan.unknown;
          setForm((p) => ({
            ...p,
            name: isUnknown ? "Unknown Plant" : scan.common_name || p.name,
            species: isUnknown ? "Unidentified" : scan.scientific_name || p.species,
            locationType:
              scan.suggested_location === "indoor"
                ? "indoor"
                : scan.suggested_location === "outdoor"
                  ? "outdoor"
                  : p.locationType,
            sunExposure:
              scan.suggested_sun === "full_sun" ||
              scan.suggested_sun === "partial_sun" ||
              scan.suggested_sun === "shade"
                ? scan.suggested_sun
                : p.sunExposure,
          }));
          if (scan.imageDataUrl) {
            setPreview(scan.imageDataUrl);
            setPhotoStatus("real_photo");
            setFromScanPhoto(true);
          }
          if (scan.database_species_id) setSpeciesId(scan.database_species_id);
          setEntryMode("manual");
          setStep(2);
          sessionStorage.removeItem(SCAN_PREFILL_KEY);
        }
      } catch {
        /* ignore */
      }
    }

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
          if (tag.imageDataUrl) setPreview(tag.imageDataUrl);
          setEntryMode("manual");
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
        locationType:
          locationType === "indoor" || locationType === "outdoor" ? locationType : p.locationType,
        sunExposure:
          sunExposure === "full_sun" ||
          sunExposure === "partial_sun" ||
          sunExposure === "shade"
            ? sunExposure
            : p.sunExposure,
      }));
      setEntryMode("manual");
      setStep(2);
    }

    if (id) {
      const found = getPlantSpeciesById(id);
      if (found) {
        setSpeciesId(id);
        setSpeciesImage(found.image_url);
        setEntryMode("search");
        setForm((p) => ({
          ...p,
          name: name || found.common_name,
          species: found.scientific_name,
          locationType:
            found.type === "indoor" || found.type === "succulent" ? "indoor" : p.locationType,
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
    setAddPhotoLater(false);
    setPhotoStatus("real_photo");
    setPlaceholderType(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleAddPhotoLater() {
    setAddPhotoLater(true);
    setPhotoFile(null);
    setPreview(null);
    const inferred = inferPlaceholderType(form.species, form.name);
    setPlaceholderType(inferred);
    setPhotoStatus("needs_photo");
  }

  function selectPlaceholder(type: PlaceholderImageType) {
    setPlaceholderType(type);
    setPhotoStatus("placeholder");
    setAddPhotoLater(false);
    setPhotoFile(null);
    setPreview(null);
  }

  function handleSpeciesSelect(
    id: string,
    commonName: string,
    scientificName: string,
    imageUrl: string
  ) {
    setSpeciesId(id);
    setSpeciesImage(imageUrl);
    setEntryMode("search");
    setForm((p) => ({
      ...p,
      name: commonName,
      species: scientificName,
    }));
    setStep(2);
  }

  function canContinue() {
    switch (step) {
      case 0:
        return entryMode !== null;
      case 1:
        return entryMode === "manual"
          ? form.species.trim().length > 0
          : !!speciesId || form.species.trim().length > 0;
      case 2:
        return form.name.trim().length > 0 && form.species.trim().length > 0;
      case 3:
        return form.zipCode.trim().length >= 5;
      case 4:
        return goalIds.length > 0;
      default:
        return true;
    }
  }

  async function handleSave() {
    if (atPlantLimit) {
      setError(
        `You've reached the free limit of ${plantLimit} plants. Upgrade to add more.`
      );
      return;
    }
    setError("");
    setLoading(true);
    const isFirstPlant = plants.length === 0;
    try {
      const inferred = inferPlaceholderType(form.species, form.name);
      const effectivePlaceholder = placeholderType ?? inferred;
      const hasRealPhoto = !!(photoFile || (preview && (fromScanPhoto || photoStatus === "real_photo")));
      const status: PhotoStatus = hasRealPhoto
        ? "real_photo"
        : addPhotoLater
          ? "needs_photo"
          : "placeholder";
      const image = hasRealPhoto
        ? preview || speciesImage || DEFAULT_PLANT_IMAGE
        : getPlaceholderImageUrl(effectivePlaceholder);
      const size = parseSizeFormValues(sizeForm);
      const effectiveGoals = goalIds.length > 0 ? goalIds : [DEFAULT_GOAL_ID];
      const effectivePrimary = primaryGoalId ?? effectiveGoals[0];

      const plant = await addPlant(
        {
          ...form,
          image,
          goalIds: effectiveGoals,
          primaryGoalId: effectivePrimary,
          photoStatus: status,
          placeholderImageType: hasRealPhoto ? null : effectivePlaceholder,
          ...size,
        },
        photoFile
      );
      initPlantJourney(plant, effectiveGoals, effectivePrimary);
      if (isFirstPlant) {
        markFirstPlantAdded();
      }
      trackEvent("plant_added", {
        isFirst: isFirstPlant,
        species: form.species || "unknown",
      });
      toast("Plant added to your garden.");
      router.push(
        isFirstPlant ? `/plants/${plant.id}?welcome=1` : `/plants/${plant.id}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? friendlySaveError(err.message)
          : friendlySaveError("Failed to add plant")
      );
      setLoading(false);
    }
  }

  useEffect(() => {
    if (atPlantLimit) {
      showUpgradeModal({
        headline: UPGRADE_COPY.plant_limit.title,
        copy: UPGRADE_COPY.plant_limit.message,
      });
    }
  }, [atPlantLimit, showUpgradeModal]);

  const displayImage = getPreviewImageUrl(
    preview,
    placeholderType,
    speciesImage
  );

  return (
    <div className="max-w-lg mx-auto pb-28 md:pb-8">
      {isFirstPlantFlow && (
        <Card padding="md" className="mb-4 bg-green-50 border-green-100">
          <p className="text-sm font-medium text-green-900">Your first plant</p>
          <p className="text-sm text-green-800 mt-1">
            Add one plant to unlock daily tasks, care schedules, and your garden dashboard.
          </p>
        </Card>
      )}
      {atPlantLimit && (
        <div className="mb-6">
          <UpgradePrompt
            title={UPGRADE_COPY.plant_limit.title}
            message={`${UPGRADE_COPY.plant_limit.message} You have ${plantCount} plants.`}
            lockLabel={UPGRADE_COPY.plant_limit.lockLabel}
          />
        </div>
      )}
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

      <div className="page-enter min-h-[320px]">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Add a plant</h2>
            <p className="text-sm text-gray-500">Pick the fastest way for you — you can always add a photo later.</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.push("/scanner")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 text-left hover:border-green-200 transition-all touch-manipulation"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Scan plant</p>
                  <p className="text-xs text-gray-500 mt-0.5">Use your camera — we&apos;ll identify it</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryMode("search");
                  setStep(1);
                }}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all touch-manipulation",
                  entryMode === "search"
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 hover:border-green-200"
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Search plant</p>
                  <p className="text-xs text-gray-500 mt-0.5">Find it in our database</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryMode("manual");
                  setSpeciesId(null);
                  setSpeciesImage(null);
                  setStep(1);
                }}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all touch-manipulation",
                  entryMode === "manual"
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 hover:border-green-200"
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <PenLine className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Add manually</p>
                  <p className="text-xs text-gray-500 mt-0.5">Type the name yourself</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 1 && entryMode === "search" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Search plant</h2>
            <p className="text-sm text-gray-500">Common or scientific name.</p>
            {speciesId && (
              <Card padding="md" className="bg-green-50 border-green-100">
                <p className="text-sm font-medium text-green-800">{form.name}</p>
                <p className="text-xs text-green-600 italic">{form.species}</p>
              </Card>
            )}
            <SpeciesSearchPanel compact onSelect={handleSpeciesSelect} />
          </div>
        )}

        {step === 1 && entryMode === "manual" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Plant name</h2>
            <Input
              id="species"
              name="species"
              label="Species"
              placeholder="Meyer Lemon or Citrus × meyeri"
              value={form.species}
              onChange={handleChange}
              className="text-base py-3"
            />
            <Input
              id="name-default"
              name="name"
              label="Nickname (optional)"
              placeholder="Kitchen lemon tree"
              value={form.name}
              onChange={handleChange}
              className="text-base py-3"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Photo & nickname</h2>
            <p className="text-sm text-gray-500">
              Snap a photo now, pick a placeholder, or add one later.
            </p>

            {displayImage && (
              <div className="relative h-36 rounded-xl overflow-hidden">
                <Image
                  src={displayImage}
                  alt="Plant preview"
                  fill
                  className="object-cover"
                  unoptimized={!!preview || !!placeholderType}
                />
              </div>
            )}

            <Input
              id="name"
              name="name"
              label="Nickname"
              placeholder={form.species.split(" ")[0] || "My plant"}
              value={form.name}
              onChange={handleChange}
              className="text-base py-3"
            />
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Species: </span>
              {form.species}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-12 touch-manipulation"
                onClick={() => cameraRef.current?.click()}
              >
                <Camera className="w-4 h-4" />
                Take photo
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-12 touch-manipulation"
                onClick={() => fileRef.current?.click()}
              >
                Upload
              </Button>
            </div>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />

            <Button
              variant="secondary"
              size="sm"
              className="w-full h-12 touch-manipulation"
              onClick={handleAddPhotoLater}
            >
              Add now, photo later
            </Button>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Or use a placeholder
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PLACEHOLDER_OPTIONS.map((opt) => (
                  <PlaceholderPickerCard
                    key={opt.id}
                    type={opt.id}
                    selected={placeholderType === opt.id}
                    onSelect={() => selectPlaceholder(opt.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Location & size</h2>
              <p className="text-sm text-gray-500 mt-1">Used for local care tips and watering guidance.</p>
            </div>
            <Input
              id="zipCode"
              name="zipCode"
              label="ZIP code"
              placeholder="91101"
              inputMode="numeric"
              value={form.zipCode}
              onChange={handleChange}
              className="text-base py-3 text-lg tracking-wide"
            />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Indoor or outdoor?</p>
              <div className="grid grid-cols-2 gap-3">
                {(["indoor", "outdoor"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, locationType: v }))}
                    className={cn(
                      "h-14 rounded-2xl border-2 text-sm font-medium transition-all touch-manipulation",
                      form.locationType === v
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-200 text-gray-600"
                    )}
                  >
                    {LOCATION_TYPE_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Sun exposure</p>
              <div className="space-y-2">
                {(["full_sun", "partial_sun", "shade"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, sunExposure: v }))}
                    className={cn(
                      "w-full h-12 rounded-xl border-2 text-sm font-medium transition-all touch-manipulation px-4 text-left",
                      form.sunExposure === v
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-200 text-gray-600"
                    )}
                  >
                    {SUN_EXPOSURE_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Pot or in-ground?</p>
              <div className="grid grid-cols-2 gap-3">
                {(["pot", "ground"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, plantingType: v }))}
                    className={cn(
                      "h-12 rounded-xl border-2 text-sm font-medium transition-all touch-manipulation",
                      form.plantingType === v
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-200 text-gray-600"
                    )}
                  >
                    {PLANTING_TYPE_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <LocalMatchCheck
              name={form.name}
              species={form.species}
              zipCode={form.zipCode}
              locationType={form.locationType}
              plantingType={form.plantingType}
              sunExposure={form.sunExposure}
            />
            <PlantSizeFieldsForm values={sizeForm} onChange={setSizeForm} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Your goal</h2>
            <p className="text-sm text-gray-500">
              We pre-selected &ldquo;Keep it alive&rdquo; — change it if you like.
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
            <Card padding="md" className="text-sm space-y-1 bg-gray-50">
              <p className="font-medium text-gray-900">{form.name || form.species}</p>
              <p className="text-gray-500 text-xs">
                {getGoalsByIds(goalIds.length ? goalIds : [DEFAULT_GOAL_ID])
                  .map((g) => g.name)
                  .join(" · ")}
              </p>
            </Card>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl whitespace-pre-wrap">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button
            variant="outline"
            size="lg"
            className="h-14 flex-1 touch-manipulation"
            onClick={() => setStep((s) => s - 1)}
            disabled={loading}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            size="lg"
            className="h-14 flex-1 touch-manipulation"
            disabled={!canContinue()}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="h-14 flex-1 touch-manipulation"
            loading={loading}
            disabled={atPlantLimit || !canContinue()}
            onClick={handleSave}
          >
            <Check className="w-5 h-5" />
            Save plant
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  NURSERY_CONTAINER_SIZES,
  SIZE_TYPE_LABELS,
  type PlantSizeType,
} from "@/lib/plants/plant-size";

export interface PlantSizeFormValues {
  sizeType: PlantSizeType;
  nurseryContainerSize: string;
  heightFeet: string;
  heightInches: string;
  potDiameterInches: string;
  trunkDiameterInches: string;
  estimatedAgeMonths: string;
  plantedDate: string;
  purchaseDate: string;
  purchasePrice: string;
  purchaseStore: string;
}

export const EMPTY_SIZE_FORM: PlantSizeFormValues = {
  sizeType: "unknown",
  nurseryContainerSize: "",
  heightFeet: "",
  heightInches: "",
  potDiameterInches: "",
  trunkDiameterInches: "",
  estimatedAgeMonths: "",
  plantedDate: "",
  purchaseDate: "",
  purchasePrice: "",
  purchaseStore: "",
};

export function parseSizeFormValues(form: PlantSizeFormValues) {
  return {
    sizeType: form.sizeType,
    nurseryContainerSize: form.nurseryContainerSize || null,
    heightFeet: form.heightFeet ? Number(form.heightFeet) : null,
    heightInches: form.heightInches ? Number(form.heightInches) : null,
    potDiameterInches: form.potDiameterInches ? Number(form.potDiameterInches) : null,
    trunkDiameterInches: form.trunkDiameterInches ? Number(form.trunkDiameterInches) : null,
    estimatedAgeMonths: form.estimatedAgeMonths ? Number(form.estimatedAgeMonths) : null,
    plantedDate: form.plantedDate || null,
    purchaseDate: form.purchaseDate || null,
    purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
    purchaseStore: form.purchaseStore || null,
  };
}

export function sizeFormFromPlant(plant: {
  sizeType: PlantSizeType;
  nurseryContainerSize: string | null;
  heightFeet: number | null;
  heightInches: number | null;
  potDiameterInches: number | null;
  trunkDiameterInches: number | null;
  estimatedAgeMonths: number | null;
  plantedDate: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  purchaseStore: string | null;
}): PlantSizeFormValues {
  return {
    sizeType: plant.sizeType,
    nurseryContainerSize: plant.nurseryContainerSize ?? "",
    heightFeet: plant.heightFeet?.toString() ?? "",
    heightInches: plant.heightInches?.toString() ?? "",
    potDiameterInches: plant.potDiameterInches?.toString() ?? "",
    trunkDiameterInches: plant.trunkDiameterInches?.toString() ?? "",
    estimatedAgeMonths: plant.estimatedAgeMonths?.toString() ?? "",
    plantedDate: plant.plantedDate ?? "",
    purchaseDate: plant.purchaseDate ?? "",
    purchasePrice: plant.purchasePrice?.toString() ?? "",
    purchaseStore: plant.purchaseStore ?? "",
  };
}

export function PlantSizeFieldsForm({
  values,
  onChange,
}: {
  values: PlantSizeFormValues;
  onChange: (next: PlantSizeFormValues) => void;
}) {
  function set<K extends keyof PlantSizeFormValues>(key: K, val: PlantSizeFormValues[K]) {
    onChange({ ...values, [key]: val });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Plant size type</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SIZE_TYPE_LABELS) as PlantSizeType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set("sizeType", type)}
              className={cn(
                "rounded-xl border-2 px-3 py-2.5 text-xs font-medium text-left transition-all",
                values.sizeType === type
                  ? "border-green-600 bg-green-50 text-green-800"
                  : "border-gray-200 text-gray-600"
              )}
            >
              {SIZE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {values.sizeType === "nursery_container" && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Nursery container</p>
          <div className="grid grid-cols-2 gap-2">
            {NURSERY_CONTAINER_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => set("nurseryContainerSize", size)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-xs font-medium",
                  values.nurseryContainerSize === size
                    ? "border-green-600 bg-green-50 text-green-800"
                    : "border-gray-200 text-gray-600"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {values.sizeType === "height" && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Feet"
            inputMode="numeric"
            value={values.heightFeet}
            onChange={(e) => set("heightFeet", e.target.value)}
            placeholder="5"
          />
          <Input
            label="Inches"
            inputMode="numeric"
            value={values.heightInches}
            onChange={(e) => set("heightInches", e.target.value)}
            placeholder="6"
          />
        </div>
      )}

      {values.sizeType === "pot_diameter" && (
        <Input
          label='Pot diameter (inches)'
          inputMode="decimal"
          value={values.potDiameterInches}
          onChange={(e) => set("potDiameterInches", e.target.value)}
          placeholder="14"
        />
      )}

      {values.sizeType === "trunk_diameter" && (
        <Input
          label='Trunk diameter (inches)'
          inputMode="decimal"
          value={values.trunkDiameterInches}
          onChange={(e) => set("trunkDiameterInches", e.target.value)}
          placeholder="4"
        />
      )}

      <div className="pt-2 border-t border-gray-100 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Optional details
        </p>
        <Input
          label="Estimated age (months)"
          inputMode="numeric"
          value={values.estimatedAgeMonths}
          onChange={(e) => set("estimatedAgeMonths", e.target.value)}
        />
        <Input
          label="Planted date"
          type="date"
          value={values.plantedDate}
          onChange={(e) => set("plantedDate", e.target.value)}
        />
        <Input
          label="Purchase date"
          type="date"
          value={values.purchaseDate}
          onChange={(e) => set("purchaseDate", e.target.value)}
        />
        <Input
          label="Purchase price ($)"
          inputMode="decimal"
          value={values.purchasePrice}
          onChange={(e) => set("purchasePrice", e.target.value)}
        />
        <Input
          label="Store / nursery"
          value={values.purchaseStore}
          onChange={(e) => set("purchaseStore", e.target.value)}
          placeholder="Local nursery name"
        />
      </div>
    </div>
  );
}

import {
  aiError,
  aiSuccess,
  requireString,
  optionalString,
} from "@/lib/ai/route-utils";
import { generateLandscapeDesign } from "@/lib/ai/landscape-design";
import { GARDEN_STYLE_IDS } from "@/lib/landscape/garden-styles";
import type {
  BudgetRange,
  LandscapeDesignRequest,
  LandscapeProjectPhoto,
  MaintenancePreference,
  SpaceType,
  StyleGoal,
  SunExposure,
  YardSize,
} from "@/lib/landscape/types";

const VALID_SPACES: SpaceType[] = [
  "front_yard",
  "back_yard",
  "side_yard",
  "patio",
  "balcony",
  "slope",
];

const VALID_SUN: SunExposure[] = ["full_sun", "partial_sun", "shade", "mixed"];
const VALID_SIZES: YardSize[] = ["small", "medium", "large", "unknown"];
const VALID_BUDGETS: BudgetRange[] = [
  "under_500",
  "500_2500",
  "2500_8000",
  "8000_plus",
  "flexible",
];
const VALID_STYLES = GARDEN_STYLE_IDS as StyleGoal[];
const VALID_MAINT: MaintenancePreference[] = ["low", "medium", "high"];

function requireEnum<T extends string>(
  body: Record<string, unknown>,
  key: string,
  allowed: T[]
): T | null {
  const val = requireString(body, key) as T | null;
  if (!val || !allowed.includes(val)) return null;
  return val;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return aiError("Invalid JSON body");
  }

  const imageDataUrl = requireString(body, "imageDataUrl");
  const zipCode = requireString(body, "zipCode");
  const spaceType = requireEnum(body, "spaceType", VALID_SPACES);
  const sunExposure = requireEnum(body, "sunExposure", VALID_SUN);
  const yardSize = requireEnum(body, "yardSize", VALID_SIZES);
  const budgetRange = requireEnum(body, "budgetRange", VALID_BUDGETS);
  const styleGoal = requireEnum(body, "styleGoal", VALID_STYLES);
  const maintenancePreference = requireEnum(body, "maintenancePreference", VALID_MAINT);

  if (
    !imageDataUrl ||
    !zipCode ||
    !spaceType ||
    !sunExposure ||
    !yardSize ||
    !budgetRange ||
    !styleGoal
  ) {
    return aiError(
      "imageDataUrl, zipCode, spaceType, sunExposure, yardSize, budgetRange, and styleGoal are required"
    );
  }

  if (!/^\d{5}$/.test(zipCode)) {
    return aiError("zipCode must be 5 digits");
  }

  const additionalPhotos = Array.isArray(body.additionalPhotos)
    ? (body.additionalPhotos as LandscapeProjectPhoto[])
    : undefined;

  try {
    const design = await generateLandscapeDesign({
      imageDataUrl,
      additionalPhotos,
      zipCode,
      spaceType,
      sunExposure,
      yardSize,
      budgetRange,
      styleGoal,
      maintenancePreference: maintenancePreference ?? undefined,
      notes: optionalString(body, "notes") ?? optionalString(body, "inspiration"),
      generateConceptImage: body.generateConceptImage !== false,
    } satisfies LandscapeDesignRequest);

    return aiSuccess(design, false);
  } catch (e) {
    return aiError(
      e instanceof Error ? e.message : "Landscape design failed",
      500
    );
  }
}

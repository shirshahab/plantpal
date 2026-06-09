import {
  aiError,
  aiSuccess,
  requireString,
  optionalString,
} from "@/lib/ai/route-utils";
import { generateLandscapeDesign } from "@/lib/ai/landscape-design";
import type {
  BudgetRange,
  LandscapeDesignRequest,
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
const VALID_STYLES: StyleGoal[] = [
  "fruit_garden",
  "low_maintenance",
  "native_garden",
  "tropical",
  "mediterranean",
  "japanese_garden",
  "kids_family",
  "pollinator",
  "privacy",
  "outdoor_living",
];

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

  try {
    const design = await generateLandscapeDesign({
      imageDataUrl,
      zipCode,
      spaceType,
      sunExposure,
      yardSize,
      budgetRange,
      styleGoal,
      notes: optionalString(body, "notes") ?? optionalString(body, "inspiration"),
    } satisfies LandscapeDesignRequest);

    return aiSuccess(design, false);
  } catch (e) {
    return aiError(
      e instanceof Error ? e.message : "Landscape design failed",
      500
    );
  }
}

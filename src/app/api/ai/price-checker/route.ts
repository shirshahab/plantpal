import { generatePriceCheck } from "@/lib/ai/price-checker";
import {
  aiError,
  aiSuccess,
  optionalString,
  requireString,
} from "@/lib/ai/route-utils";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return aiError("Invalid JSON body");
  }

  const plantName = requireString(body, "plantName");
  if (!plantName) {
    return aiError("plantName is required");
  }

  try {
    const result = await generatePriceCheck({
      plantName,
      size: optionalString(body, "size") ?? "3 gallon",
      zipCode: optionalString(body, "zipCode") ?? "00000",
      storeType: optionalString(body, "storeType") ?? "any",
      condition: optionalString(body, "condition") ?? "healthy",
      priceAsked:
        typeof body.priceAsked === "number" ? body.priceAsked : undefined,
    });

    return aiSuccess(result, false);
  } catch (e) {
    return aiError(e instanceof Error ? e.message : "Price check failed", 500);
  }
}

import type { AIPriceCheckResponse, PriceCheckerAIRequest } from "@/lib/types/ai";
import { checkPlantPrice } from "@/lib/mock/price-checker";
import { chatJSON, isOpenAIConfigured } from "./openai";
import { GARDENER_SYSTEM_PROMPT } from "./prompts";

const PRICE_SCHEMA = `{
  "corrected_plant_name": "string",
  "estimated_price_range": "string e.g. $25–$45",
  "good_buy_price": "string",
  "overpriced_above": "string",
  "what_to_look_for": ["string"],
  "red_flags": ["string"],
  "better_alternatives": ["string"],
  "buy_pass_verdict": "Strong Buy" | "Good Buy" | "Fair" | "Pass" | "Needs Inspection"
}`;

function mockPriceCheck(input: PriceCheckerAIRequest): AIPriceCheckResponse {
  const result = checkPlantPrice({
    plantName: input.plantName,
    size: input.size as "3 gallon",
    zipCode: input.zipCode,
    storeType: input.storeType as "any",
    condition: input.condition as "healthy",
    hasPhoto: false,
  });

  return {
    corrected_plant_name: result.correctedName,
    estimated_price_range: `$${result.fairRange[0]}–$${result.fairRange[1]}`,
    good_buy_price: `Under $${result.pricing.buyUnderPrice}`,
    overpriced_above: `Above $${result.pricing.overpricedAbove}`,
    what_to_look_for: result.checklist,
    red_flags: result.redFlags,
    better_alternatives: result.alternatives,
    buy_pass_verdict: result.recommendation,
    source: "mock",
  };
}

export async function generatePriceCheck(
  input: PriceCheckerAIRequest
): Promise<AIPriceCheckResponse> {
  if (!isOpenAIConfigured()) {
    return mockPriceCheck(input);
  }

  try {
    const raw = await chatJSON<Omit<AIPriceCheckResponse, "source">>(
      `${GARDENER_SYSTEM_PROMPT}\n\nYou help buyers evaluate nursery plant prices. Use reasonable US nursery price estimates. Return JSON:\n${PRICE_SCHEMA}`,
      `Evaluate this nursery purchase.

Plant: ${input.plantName}
Size: ${input.size}
ZIP: ${input.zipCode}
Store type: ${input.storeType}
Condition: ${input.condition}
${input.priceAsked ? `Asking price: $${input.priceAsked}` : "No asking price given"}`
    );

    return { ...raw, source: "ai" };
  } catch {
    return mockPriceCheck(input);
  }
}

import { getOpenAIClient, isOpenAIConfigured } from "./openai";
import { redactSecrets } from "./redact-secrets";

const LOG = "[landscape-render]";

export interface ConceptImageInput {
  styleLabel: string;
  spaceLabel: string;
  description: string;
  zipCode: string;
  usdaZone: string;
}

/** Generate a conceptual landscape render via DALL·E 3. Returns temporary OpenAI URL. */
export async function generateLandscapeConceptImage(
  input: ConceptImageInput
): Promise<string | null> {
  if (!isOpenAIConfigured()) return null;

  const prompt = [
    "Professional landscape architecture concept design render.",
    `${input.styleLabel} garden style for a ${input.spaceLabel}.`,
    `USDA zone ${input.usdaZone}, ZIP ${input.zipCode}.`,
    input.description,
    "Photorealistic, natural daylight, wide angle, no text, no watermark, no people.",
  ].join(" ");

  try {
    const client = getOpenAIClient();
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt: prompt.slice(0, 3800),
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    const url = response.data?.[0]?.url ?? null;
    console.info(`${LOG} generated`, { style: input.styleLabel, hasUrl: !!url });
    return url;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${LOG} failed`, redactSecrets(message));
    return null;
  }
}

/** Estimated API cost per concept image (DALL·E 3 standard 1024×1024). */
export const CONCEPT_IMAGE_ESTIMATED_USD = 0.04;

/** Estimated vision + JSON design cost (gpt-4o-mini, ~1 image). */
export const DESIGN_ANALYSIS_ESTIMATED_USD = 0.02;

export const FULL_MVP_ESTIMATED_USD =
  DESIGN_ANALYSIS_ESTIMATED_USD + CONCEPT_IMAGE_ESTIMATED_USD;

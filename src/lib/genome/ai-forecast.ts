import type { PlantGenomeState } from "./types";

/** Input for future AI-powered genome forecasting. */
export interface AIGenomeForecastRequest {
  plantId: string;
  plantName: string;
  species: string;
  zipCode: string;
  currentGenome: PlantGenomeState;
  horizonDays: 30 | 90 | 120;
}

export interface AIGenomeForecastResponse {
  forecasts: PlantGenomeState["forecast30"];
  model: string;
  source: "ai" | "mock";
}

/** Provider interface — swap mock for OpenAI / fine-tuned model later. */
export interface GenomeForecastProvider {
  forecast(request: AIGenomeForecastRequest): Promise<AIGenomeForecastResponse>;
}

/** Mock provider — returns empty; real forecasts come from compute-genome today. */
export const mockGenomeForecastProvider: GenomeForecastProvider = {
  async forecast() {
    return {
      forecasts: [],
      model: "mock-v1",
      source: "mock",
    };
  },
};

/** Placeholder for Phase 18+ AI integration. */
export async function requestAIGenomeForecast(
  request: AIGenomeForecastRequest,
  provider: GenomeForecastProvider = mockGenomeForecastProvider
): Promise<AIGenomeForecastResponse> {
  return provider.forecast(request);
}

/**
 * Integration health checks — server-side only, never exposes secrets.
 */

import { isOpenAIConfigured } from "@/lib/ai/openai";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isPerenualEnabled } from "@/lib/integrations/perenual";
import { isPlantNetEnabled } from "@/lib/integrations/plantnet";
import { isSerpApiEnabled } from "@/lib/integrations/plant-prices";
import { getWeatherProvider } from "@/lib/integrations/weather";
import type { IntegrationHealthCard, IntegrationStatus } from "@/lib/types/integrations";

function card(
  id: string,
  name: string,
  status: IntegrationStatus,
  message: string
): IntegrationHealthCard {
  return { id, name, status, message };
}

export function getIntegrationsHealth(): IntegrationHealthCard[] {
  const openai = isOpenAIConfigured();
  const supabase = isSupabaseConfigured();
  const weatherProvider = getWeatherProvider();
  const openWeatherKey = Boolean(process.env.OPENWEATHER_API_KEY?.trim());
  const perenual = isPerenualEnabled();
  const plantnet = isPlantNetEnabled();
  const serp = isSerpApiEnabled();

  return [
    openai
      ? card("openai", "OpenAI", "connected", "Vision and care AI are active.")
      : card("openai", "OpenAI", "mock_fallback", "Using smart mock responses — add OPENAI_API_KEY."),

    supabase
      ? card("supabase", "Supabase", "connected", "Cloud sync and database are configured.")
      : card("supabase", "Supabase", "missing_key", "Local-only mode — add Supabase env vars."),

    openWeatherKey && weatherProvider === "openweather"
      ? card("openweather", "OpenWeather", "connected", "Live weather data is active.")
      : openWeatherKey
        ? card(
            "openweather",
            "OpenWeather",
            "mock_fallback",
            "Key present but WEATHER_PROVIDER is not set to openweather."
          )
        : card(
            "openweather",
            "OpenWeather",
            "mock_fallback",
            "Using climate mock — add OPENWEATHER_API_KEY."
          ),

    perenual
      ? card("perenual", "Perenual", "connected", "External plant database search is active.")
      : card("perenual", "Perenual", "mock_fallback", "Internal database only — add PERENUAL_API_KEY."),

    plantnet
      ? card("plantnet", "Pl@ntNet", "connected", "Scanner second-opinion ID is active.")
      : card("plantnet", "Pl@ntNet", "mock_fallback", "OpenAI Vision only — add PLANTNET_API_KEY."),

    serp
      ? card("serpapi", "SerpAPI", "connected", "Live nursery price search is active.")
      : card("serpapi", "SerpAPI", "mock_fallback", "Using estimated price ranges — add SERPAPI_KEY."),
  ];
}

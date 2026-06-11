/**
 * Integration health — configured, reachable, live vs fallback.
 * Server-side only; never exposes secrets.
 */

import type { IntegrationHealthCard, IntegrationStatus } from "@/lib/types/integrations";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  INTEGRATION_ENV_VARS,
  isOpenAIKeyConfigured,
  isOpenWeatherKeyConfigured,
  isPerenualKeyConfigured,
  isPlantNetKeyConfigured,
  isSerpApiKeyConfigured,
  isWeatherLiveEnabled,
  getWeatherProviderEnv,
} from "@/lib/integrations/env-config";
import {
  probeOpenAI,
  probeOpenWeather,
  probePerenual,
  probePlantNet,
  probeSerpApi,
  probeSupabaseClient,
  type ProbeResult,
} from "@/lib/integrations/probe";

function buildCard(input: {
  id: string;
  name: string;
  envVar: string;
  configured: boolean;
  probe: ProbeResult;
  liveWhen: boolean;
  configuredMessage: string;
  liveMessage: string;
  fallbackMessage: string;
  missingKeyMessage: string;
}): IntegrationHealthCard {
  const { configured, probe, liveWhen } = input;
  const reachable = configured ? probe.reachable : null;
  const authOk = configured ? probe.authOk : null;
  const usingLive = configured && probe.reachable && probe.authOk && liveWhen;
  const fallbackActive = !usingLive;

  let status: IntegrationStatus;
  let message: string;

  if (!configured) {
    status = "missing_key";
    message = input.missingKeyMessage;
  } else if (!probe.reachable) {
    status = "error";
    message = probe.error ?? "API unreachable. Using fallback.";
  } else if (!probe.authOk) {
    status = "error";
    message = probe.error ?? "Key rejected by provider. Using fallback.";
  } else if (!liveWhen) {
    status = "mock_fallback";
    message = input.fallbackMessage;
  } else {
    status = "connected";
    message = input.liveMessage;
  }

  return {
    id: input.id,
    name: input.name,
    envVar: input.envVar,
    status,
    message,
    configured,
    reachable,
    authOk,
    usingLive,
    fallbackActive,
    checkedAt: new Date().toISOString(),
  };
}

function weatherLiveWhen(): boolean {
  return isWeatherLiveEnabled();
}

export async function getIntegrationsHealth(): Promise<IntegrationHealthCard[]> {
  const [openai, openweather, perenual, plantnet, serpapi, supabase] = await Promise.all([
    probeOpenAI(),
    probeOpenWeather(),
    probePerenual(),
    probePlantNet(),
    probeSerpApi(),
    probeSupabaseClient(),
  ]);

  const weatherConfigured = isOpenWeatherKeyConfigured();
  const weatherProvider = getWeatherProviderEnv() || "(default)";

  return [
    buildCard({
      id: "supabase",
      name: "Supabase",
      envVar: `${INTEGRATION_ENV_VARS.supabaseUrl} + ${INTEGRATION_ENV_VARS.supabaseAnon}`,
      configured: isSupabaseConfigured(),
      probe: supabase,
      liveWhen: isSupabaseConfigured() && supabase.reachable && supabase.authOk,
      configuredMessage: "Database and auth env vars set.",
      liveMessage: "Cloud database reachable. Live sync when signed in.",
      fallbackMessage: "Local mock mode. Data stays in this browser.",
      missingKeyMessage: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    }),

    buildCard({
      id: "openai",
      name: "OpenAI",
      envVar: INTEGRATION_ENV_VARS.openai,
      configured: isOpenAIKeyConfigured(),
      probe: openai,
      liveWhen: true,
      configuredMessage: "OPENAI_API_KEY set.",
      liveMessage: "Live AI: scanner, doctor, care plans, and price analysis.",
      fallbackMessage: "Smart mock responses when OpenAI unavailable.",
      missingKeyMessage: "Add OPENAI_API_KEY for live AI features.",
    }),

    buildCard({
      id: "openweather",
      name: "OpenWeather",
      envVar: `${INTEGRATION_ENV_VARS.openweather} + ${INTEGRATION_ENV_VARS.weatherProvider}=openweather`,
      configured: weatherConfigured,
      probe: openweather,
      liveWhen: weatherLiveWhen() && openweather.authOk,
      configuredMessage: `Key set (provider: ${weatherProvider}).`,
      liveMessage: "Live weather on /today and weather cards.",
      fallbackMessage:
        weatherConfigured && weatherProvider !== "openweather"
          ? `Key present but WEATHER_PROVIDER is "${weatherProvider}". Set WEATHER_PROVIDER=openweather for live data.`
          : "Climate-aware mock weather when key missing or unreachable.",
      missingKeyMessage: "Add OPENWEATHER_API_KEY and WEATHER_PROVIDER=openweather.",
    }),

    buildCard({
      id: "perenual",
      name: "Perenual",
      envVar: INTEGRATION_ENV_VARS.perenual,
      configured: isPerenualKeyConfigured(),
      probe: perenual,
      liveWhen: true,
      configuredMessage: "PERENUAL_API_KEY set.",
      liveMessage: "Live plant search after Supabase species table.",
      fallbackMessage: "Internal seed database and AI suggestions only.",
      missingKeyMessage: "Add PERENUAL_API_KEY for external plant search.",
    }),

    buildCard({
      id: "plantnet",
      name: "Pl@ntNet",
      envVar: INTEGRATION_ENV_VARS.plantnet,
      configured: isPlantNetKeyConfigured(),
      probe: plantnet,
      liveWhen: true,
      configuredMessage: "PLANTNET_API_KEY set.",
      liveMessage: "Scanner second opinion alongside OpenAI.",
      fallbackMessage: "OpenAI-only identification when Pl@ntNet unavailable.",
      missingKeyMessage: "Add PLANTNET_API_KEY for scanner second opinion.",
    }),

    buildCard({
      id: "serpapi",
      name: "SerpAPI",
      envVar: INTEGRATION_ENV_VARS.serpapi,
      configured: isSerpApiKeyConfigured(),
      probe: serpapi,
      liveWhen: true,
      configuredMessage: "SERPAPI_KEY set.",
      liveMessage: "Live Google Shopping results in Price Checker.",
      fallbackMessage: "Estimated price ranges when SerpAPI unavailable.",
      missingKeyMessage: "Add SERPAPI_KEY for live shopping prices.",
    }),
  ];
}

/** Sync snapshot — configured only, no network probes (legacy). */
export function getIntegrationsHealthSync(): IntegrationHealthCard[] {
  const weatherConfigured = isOpenWeatherKeyConfigured();
  const weatherLive = isWeatherLiveEnabled();

  const mk = (
    id: string,
    name: string,
    envVar: string,
    configured: boolean,
    usingLive: boolean,
    liveMsg: string,
    fallbackMsg: string
  ): IntegrationHealthCard => ({
    id,
    name,
    envVar,
    configured,
    reachable: null,
    authOk: null,
    usingLive: configured && usingLive,
    fallbackActive: !(configured && usingLive),
    status: !configured ? "missing_key" : usingLive ? "connected" : "mock_fallback",
    message: !configured ? fallbackMsg : usingLive ? liveMsg : fallbackMsg,
    checkedAt: new Date().toISOString(),
  });

  return [
    mk(
      "supabase",
      "Supabase",
      `${INTEGRATION_ENV_VARS.supabaseUrl} + ${INTEGRATION_ENV_VARS.supabaseAnon}`,
      isSupabaseConfigured(),
      isSupabaseConfigured(),
      "Cloud database configured.",
      "Add Supabase env vars."
    ),
    mk(
      "openai",
      "OpenAI",
      INTEGRATION_ENV_VARS.openai,
      isOpenAIKeyConfigured(),
      isOpenAIKeyConfigured(),
      "OpenAI key configured.",
      "Add OPENAI_API_KEY."
    ),
    mk(
      "openweather",
      "OpenWeather",
      INTEGRATION_ENV_VARS.openweather,
      weatherConfigured,
      weatherLive,
      "Live weather enabled.",
      "Add OPENWEATHER_API_KEY + WEATHER_PROVIDER=openweather."
    ),
    mk(
      "perenual",
      "Perenual",
      INTEGRATION_ENV_VARS.perenual,
      isPerenualKeyConfigured(),
      isPerenualKeyConfigured(),
      "Perenual key configured.",
      "Add PERENUAL_API_KEY."
    ),
    mk(
      "plantnet",
      "Pl@ntNet",
      INTEGRATION_ENV_VARS.plantnet,
      isPlantNetKeyConfigured(),
      isPlantNetKeyConfigured(),
      "Pl@ntNet key configured.",
      "Add PLANTNET_API_KEY."
    ),
    mk(
      "serpapi",
      "SerpAPI",
      INTEGRATION_ENV_VARS.serpapi,
      isSerpApiKeyConfigured(),
      isSerpApiKeyConfigured(),
      "SerpAPI key configured.",
      "Add SERPAPI_KEY."
    ),
  ];
}

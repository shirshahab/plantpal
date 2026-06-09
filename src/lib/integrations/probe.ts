/**
 * Live reachability probes — minimal API calls, server-side only.
 */

import { createClient } from "@supabase/supabase-js";
import {
  getOpenAIKey,
  getOpenWeatherKey,
  getPerenualKey,
  getPlantNetKey,
  getSerpApiKey,
  isOpenAIKeyConfigured,
  isOpenWeatherKeyConfigured,
  isPerenualKeyConfigured,
  isPlantNetKeyConfigured,
  isSerpApiKeyConfigured,
  isWeatherLiveEnabled,
  INTEGRATION_ENV_VARS,
} from "@/lib/integrations/env-config";
import { isSupabaseConfigured, getSupabasePublicConfig } from "@/lib/supabase/config";

const PROBE_MS = 10_000;

export interface ProbeResult {
  reachable: boolean;
  authOk: boolean;
  error?: string;
}

async function fetchProbe(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

export async function probeOpenAI(): Promise<ProbeResult> {
  if (!isOpenAIKeyConfigured()) {
    return { reachable: false, authOk: false, error: "Key not configured" };
  }
  try {
    const res = await fetchProbe("https://api.openai.com/v1/models?limit=1", {
      headers: { Authorization: `Bearer ${getOpenAIKey()}` },
    });
    if (res.ok) return { reachable: true, authOk: true };
    if (res.status === 401 || res.status === 403) {
      return { reachable: true, authOk: false, error: "Invalid or unauthorized API key" };
    }
    return { reachable: true, authOk: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return {
      reachable: false,
      authOk: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export async function probeOpenWeather(): Promise<ProbeResult> {
  if (!isOpenWeatherKeyConfigured()) {
    return { reachable: false, authOk: false, error: "Key not configured" };
  }
  try {
    const key = getOpenWeatherKey();
    const res = await fetchProbe(
      `https://api.openweathermap.org/data/2.5/weather?q=London,uk&appid=${key}&units=imperial`
    );
    if (res.ok) return { reachable: true, authOk: true };
    if (res.status === 401) {
      return { reachable: true, authOk: false, error: "Invalid OpenWeather API key" };
    }
    return { reachable: true, authOk: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return {
      reachable: false,
      authOk: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export async function probePerenual(): Promise<ProbeResult> {
  if (!isPerenualKeyConfigured()) {
    return { reachable: false, authOk: false, error: "Key not configured" };
  }
  try {
    const key = getPerenualKey();
    const url = new URL("https://perenual.com/api/v2/species-data");
    url.searchParams.set("key", key);
    url.searchParams.set("q", "rose");
    url.searchParams.set("page", "1");
    const res = await fetchProbe(url.toString());
    if (res.ok) return { reachable: true, authOk: true };
    if (res.status === 401 || res.status === 403) {
      return { reachable: true, authOk: false, error: "Invalid Perenual API key" };
    }
    return { reachable: true, authOk: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return {
      reachable: false,
      authOk: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export async function probePlantNet(): Promise<ProbeResult> {
  if (!isPlantNetKeyConfigured()) {
    return { reachable: false, authOk: false, error: "Key not configured" };
  }
  try {
    const key = getPlantNetKey();
    const res = await fetchProbe(`https://my-api.plantnet.org/v2/projects?api-key=${key}`);
    if (res.ok) return { reachable: true, authOk: true };
    if (res.status === 401 || res.status === 403) {
      return { reachable: true, authOk: false, error: "Invalid Pl@ntNet API key" };
    }
    if (res.status === 404) {
      return { reachable: true, authOk: true, error: undefined };
    }
    return { reachable: true, authOk: res.status < 500, error: `HTTP ${res.status}` };
  } catch (e) {
    return {
      reachable: false,
      authOk: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export async function probeSerpApi(): Promise<ProbeResult> {
  if (!isSerpApiKeyConfigured()) {
    return { reachable: false, authOk: false, error: "Key not configured" };
  }
  try {
    const key = getSerpApiKey();
    const res = await fetchProbe(`https://serpapi.com/account.json?api_key=${key}`);
    if (res.ok) return { reachable: true, authOk: true };
    if (res.status === 401 || res.status === 403) {
      return { reachable: true, authOk: false, error: "Invalid SerpAPI key" };
    }
    return { reachable: true, authOk: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return {
      reachable: false,
      authOk: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export async function probeSupabase(): Promise<ProbeResult> {
  if (!isSupabaseConfigured()) {
    return { reachable: false, authOk: false, error: "Env vars not configured" };
  }
  try {
    const { url, key } = getSupabasePublicConfig();
    const res = await fetchProbe(`${url}/rest/v1/plant_species?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    if (res.ok || res.status === 406) return { reachable: true, authOk: true };
    if (res.status === 401 || res.status === 403) {
      return { reachable: true, authOk: false, error: "Invalid Supabase anon key" };
    }
    return { reachable: true, authOk: res.status < 500, error: `HTTP ${res.status}` };
  } catch (e) {
    return {
      reachable: false,
      authOk: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

/** Deep Supabase probe with client — verifies auth session optional */
export async function probeSupabaseClient(): Promise<ProbeResult> {
  if (!isSupabaseConfigured()) {
    return { reachable: false, authOk: false, error: "Env vars not configured" };
  }
  try {
    const { url, key } = getSupabasePublicConfig();
    const supabase = createClient(url, key);
    const { error } = await supabase.from("plant_species").select("id").limit(1);
    if (!error) return { reachable: true, authOk: true };
    if (error.code === "PGRST301" || error.message.includes("JWT")) {
      return { reachable: true, authOk: false, error: error.message };
    }
    return { reachable: true, authOk: true, error: error.message };
  } catch (e) {
    return {
      reachable: false,
      authOk: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export { INTEGRATION_ENV_VARS, isWeatherLiveEnabled };

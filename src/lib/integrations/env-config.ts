/**
 * Central integration env var readers — server-side only.
 * Never log or return full key values.
 */

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function isValidKey(value: string, minLength = 10): boolean {
  if (!value || value.length < minLength) return false;
  if (value.includes("paste_") || value === "your_key_here") return false;
  return true;
}

export const INTEGRATION_ENV_VARS = {
  openai: "OPENAI_API_KEY",
  openweather: "OPENWEATHER_API_KEY",
  weatherProvider: "WEATHER_PROVIDER",
  plantnet: "PLANTNET_API_KEY",
  perenual: "PERENUAL_API_KEY",
  serpapi: "SERPAPI_KEY",
  supabaseUrl: "NEXT_PUBLIC_SUPABASE_URL",
  supabaseAnon: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
} as const;

export function getOpenAIKey(): string {
  return readEnv(INTEGRATION_ENV_VARS.openai);
}

export function getOpenWeatherKey(): string {
  return readEnv(INTEGRATION_ENV_VARS.openweather);
}

export function getWeatherProviderEnv(): string {
  return readEnv(INTEGRATION_ENV_VARS.weatherProvider).toLowerCase();
}

export function getPlantNetKey(): string {
  return readEnv(INTEGRATION_ENV_VARS.plantnet);
}

export function getPerenualKey(): string {
  return readEnv(INTEGRATION_ENV_VARS.perenual);
}

export function getSerpApiKey(): string {
  return readEnv(INTEGRATION_ENV_VARS.serpapi);
}

export function isOpenAIKeyConfigured(): boolean {
  return isValidKey(getOpenAIKey());
}

export function isOpenWeatherKeyConfigured(): boolean {
  return isValidKey(getOpenWeatherKey(), 16);
}

export function isPlantNetKeyConfigured(): boolean {
  return isValidKey(getPlantNetKey());
}

export function isPerenualKeyConfigured(): boolean {
  return isValidKey(getPerenualKey());
}

export function isSerpApiKeyConfigured(): boolean {
  return isValidKey(getSerpApiKey());
}

export function isWeatherLiveEnabled(): boolean {
  return isOpenWeatherKeyConfigured() && getWeatherProviderEnv() === "openweather";
}

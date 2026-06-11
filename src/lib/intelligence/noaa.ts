/**
 * NOAA / National Weather Service client (api.weather.gov).
 *
 * Free, official, no API key. Requires a User-Agent header.
 * All functions fail soft (null) so callers can fall back to OpenWeather.
 * Server-side only.
 */

import { getZipProfile } from "@/lib/integrations/zip";

const NWS_BASE = "https://api.weather.gov";
const USER_AGENT = "PlantPal (support@plantpal.app)";
const TIMEOUT_MS = 6000;

async function nwsFetch<T>(url: string, revalidate = 1800): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
      next: { revalidate },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface NwsForecastPeriod {
  name: string;
  startTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  shortForecast: string;
  probabilityOfPrecipitation?: { value: number | null };
}

export interface NwsAlert {
  event: string;
  headline: string | null;
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  description: string;
  onset: string | null;
  ends: string | null;
}

export interface NoaaWeather {
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  /** Up to ~14 half-day periods (7 days). */
  periods: NwsForecastPeriod[];
  alerts: NwsAlert[];
  source: "noaa";
}

interface PointsResponse {
  properties?: {
    forecast?: string;
    relativeLocation?: {
      properties?: { city?: string; state?: string };
    };
  };
}

interface ForecastResponse {
  properties?: { periods?: NwsForecastPeriod[] };
}

interface AlertsResponse {
  features?: { properties?: NwsAlert }[];
}

/** Gridpoint lookup: lat/lon → forecast office URL + locality. */
export async function getNwsPoint(lat: number, lon: number) {
  const data = await nwsFetch<PointsResponse>(
    `${NWS_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
    86400
  );
  const props = data?.properties;
  if (!props?.forecast) return null;
  return {
    forecastUrl: props.forecast,
    city: props.relativeLocation?.properties?.city ?? null,
    state: props.relativeLocation?.properties?.state ?? null,
  };
}

export async function getNwsAlerts(lat: number, lon: number): Promise<NwsAlert[]> {
  const data = await nwsFetch<AlertsResponse>(
    `${NWS_BASE}/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`,
    900
  );
  return (data?.features ?? [])
    .map((f) => f.properties)
    .filter((p): p is NwsAlert => Boolean(p?.event));
}

/** Full NOAA weather for a lat/lon. Null on any failure. */
export async function getNoaaWeatherByCoords(
  lat: number,
  lon: number
): Promise<NoaaWeather | null> {
  const point = await getNwsPoint(lat, lon);
  if (!point) return null;

  const [forecast, alerts] = await Promise.all([
    nwsFetch<ForecastResponse>(point.forecastUrl, 1800),
    getNwsAlerts(lat, lon),
  ]);

  const periods = forecast?.properties?.periods ?? [];
  if (periods.length === 0 && alerts.length === 0) return null;

  return {
    latitude: lat,
    longitude: lon,
    city: point.city,
    state: point.state,
    periods,
    alerts,
    source: "noaa",
  };
}

/** Full NOAA weather for a US ZIP (geocoded via Zippopotam). Null on failure. */
export async function getNoaaWeatherByZip(zipCode: string): Promise<NoaaWeather | null> {
  const profile = await getZipProfile(zipCode);
  if (profile.latitude == null || profile.longitude == null) return null;
  return getNoaaWeatherByCoords(profile.latitude, profile.longitude);
}

/** Quick availability probe for the debug view. */
export async function probeNoaa(): Promise<{ ok: boolean; detail: string }> {
  const data = await nwsFetch<PointsResponse>(`${NWS_BASE}/points/34.1478,-118.1445`, 0);
  return data?.properties?.forecast
    ? { ok: true, detail: "api.weather.gov reachable" }
    : { ok: false, detail: "api.weather.gov unreachable or rate limited" };
}

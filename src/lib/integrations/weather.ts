/**
 * Weather integration — OpenWeather when configured, mock fallback otherwise.
 */

import type { WeatherAlert, WeatherSnapshot } from "@/lib/types/phase6";
import type { WeatherInsights } from "@/lib/types/integrations";
import { getLocationProfile } from "@/lib/location/location-service";
import { lookupZipRecord } from "@/lib/location/usda-zones";
import { getZipProfile } from "@/lib/integrations/zip";
import { getOpenWeatherKey, isOpenWeatherKeyConfigured } from "@/lib/integrations/env-config";
import { cacheGet, cacheSet, cacheKey, CACHE_TTL } from "@/lib/api/server-cache";
import { recordDataSource, recordDataSourceError } from "@/lib/data-sources/runtime";

export type WeatherProvider = "mock" | "openweather" | "weatherapi" | "noaa" | "tomorrow";

export function getWeatherProvider(): WeatherProvider {
  const p = process.env.WEATHER_PROVIDER?.toLowerCase();
  if (p === "openweather" || p === "weatherapi" || p === "noaa" || p === "tomorrow") {
    return p;
  }
  if (isOpenWeatherKeyConfigured()) return "openweather";
  return "mock";
}

function enrichSnapshot(base: WeatherSnapshot, source: "live" | "mock"): WeatherInsights {
  return {
    ...base,
    tempHighF: base.tempHighF ?? base.tempF + 8,
    tempLowF: base.tempLowF ?? base.tempF - 10,
    humidity: base.humidity ?? 50,
    windSpeedMph: base.windSpeedMph ?? 5,
    rainChance: base.rainChance ?? 0,
    recommendedWateringAdjustment:
      base.recommendedWateringAdjustment ??
      base.alerts[0]?.wateringAdjustment ??
      "Water when the top inch of soil feels dry.",
    source,
  };
}

function buildAlerts(input: {
  tempF: number;
  tempHighF: number;
  tempLowF: number;
  humidity: number;
  windSpeedMph: number;
  rainChance: number;
  heatRisk: string;
  frostRisk: string;
}): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (input.tempHighF >= 95 || input.tempF >= 90 || input.heatRisk === "high") {
    alerts.push({
      type: "heat",
      severity: input.tempHighF >= 100 ? "critical" : "warning",
      title: "Heat alert",
      message: `High temperatures up to ${Math.round(input.tempHighF)}°F expected.`,
      wateringAdjustment: "Deep water young trees and containers before the hottest day.",
    });
  }

  if (input.tempLowF <= 32 || input.frostRisk === "high" || input.frostRisk === "moderate") {
    alerts.push({
      type: "frost",
      severity: input.tempLowF <= 28 ? "critical" : "info",
      title: "Frost watch",
      message:
        input.tempLowF <= 32
          ? `Overnight low near ${Math.round(input.tempLowF)}°F — protect tender plants.`
          : "Overnight lows may dip near frost line.",
      wateringAdjustment: "Cover citrus, bougainvillea, and avocado on cold nights.",
    });
  }

  if (input.windSpeedMph >= 20) {
    alerts.push({
      type: "wind",
      severity: input.windSpeedMph >= 30 ? "warning" : "info",
      title: "Wind advisory",
      message: `Gusts up to ${Math.round(input.windSpeedMph)} mph possible.`,
      wateringAdjustment: "Stake tall plants and delay pruning until winds calm.",
    });
  }

  if (input.rainChance >= 50) {
    alerts.push({
      type: "rain",
      severity: input.rainChance >= 75 ? "warning" : "info",
      title: "Rain expected",
      message: `${Math.round(input.rainChance)}% chance of rain today.`,
      wateringAdjustment: "Skip manual watering — let rainfall soak in, then check soil tomorrow.",
    });
  }

  if (input.humidity >= 80 && (input.rainChance >= 40 || input.humidity >= 88)) {
    alerts.push({
      type: "humidity",
      severity: "info",
      title: "High humidity — fungus risk",
      message: "Humid conditions favor mildew and leaf spot on dense foliage.",
      wateringAdjustment: "Avoid wetting leaves when watering; improve airflow around plants.",
    });
  }

  if (input.rainChance <= 10 && input.humidity <= 30 && input.tempHighF >= 85) {
    alerts.push({
      type: "drought",
      severity: "info",
      title: "Dry spell — drought stress risk",
      message: "Hot, dry conditions with no rain in sight can stress shallow-rooted plants.",
      wateringAdjustment: "Water deeply in the early morning and add mulch to hold moisture.",
    });
  }

  return alerts;
}

function buildMockWeather(zipCode: string): WeatherInsights {
  const profile = getLocationProfile(zipCode);
  const record = lookupZipRecord(zipCode);
  const location = `${profile.city}, ${profile.state}`;
  const tempF = record.heatRisk === "high" ? 88 : record.climateType === "Marine" ? 62 : 75;
  const tempHighF = tempF + (record.heatRisk === "high" ? 6 : 4);
  const tempLowF = tempF - (record.frostRisk === "high" ? 14 : 10);
  const humidity = record.climateType === "Marine" ? 72 : record.heatRisk === "high" ? 35 : 55;
  const windSpeedMph = profile.climateType === "Mediterranean" ? 12 : 6;
  const rainChance = record.droughtRisk === "high" ? 5 : 35;

  const alerts = buildAlerts({
    tempF,
    tempHighF,
    tempLowF,
    humidity,
    windSpeedMph,
    rainChance,
    heatRisk: record.heatRisk,
    frostRisk: record.frostRisk,
  });

  const summary =
    alerts.length > 0
      ? `${profile.city} — ${alerts[0].title.toLowerCase()}. ${alerts[0].wateringAdjustment}`
      : `${profile.city} (${profile.usdaZone}) — ${profile.climateType} climate. Adjust care to local conditions.`;

  return enrichSnapshot(
    {
      location,
      zipCode: profile.zipCode,
      condition: record.heatRisk === "high" ? "Sunny & warm" : "Mild",
      tempF,
      tempHighF,
      tempLowF,
      humidity,
      windSpeedMph,
      rainChance,
      alerts,
      summary,
    },
    "mock"
  );
}

interface OpenWeatherCurrent {
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  weather: { description: string }[];
  wind: { speed: number };
}

interface OpenWeatherForecastItem {
  dt: number;
  main: { temp_min: number; temp_max: number };
  pop: number;
}

interface OpenWeatherForecast {
  list: OpenWeatherForecastItem[];
}

async function fetchOpenWeather(zipCode: string): Promise<WeatherInsights | null> {
  const key = getOpenWeatherKey();
  if (!key) return null;

  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${key}`,
      { next: { revalidate: 3600 } }
    );
    if (!geoRes.ok) {
      console.error("[weather] OpenWeather geocode failed:", geoRes.status);
      return null;
    }
    const geo = (await geoRes.json()) as { lat: number; lon: number; name: string };

    const [currentRes, forecastRes, zipProfile] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${geo.lat}&lon=${geo.lon}&appid=${key}&units=imperial`,
        { next: { revalidate: 1800 } }
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${geo.lat}&lon=${geo.lon}&appid=${key}&units=imperial&cnt=8`,
        { next: { revalidate: 1800 } }
      ),
      getZipProfile(zipCode),
    ]);

    if (!currentRes.ok) {
      console.error("[weather] OpenWeather current failed:", currentRes.status);
      return null;
    }

    const current = (await currentRes.json()) as OpenWeatherCurrent;
    let tempHighF = current.main.temp_max;
    let tempLowF = current.main.temp_min;
    let rainChance = 0;

    if (forecastRes.ok) {
      const forecast = (await forecastRes.json()) as OpenWeatherForecast;
      const today = new Date().toDateString();
      for (const item of forecast.list ?? []) {
        if (new Date(item.dt * 1000).toDateString() === today) {
          tempHighF = Math.max(tempHighF, item.main.temp_max);
          tempLowF = Math.min(tempLowF, item.main.temp_min);
          rainChance = Math.max(rainChance, Math.round(item.pop * 100));
        }
      }
    }

    const record = lookupZipRecord(zipCode);
    const tempF = Math.round(current.main.temp);
    const humidity = current.main.humidity;
    const windSpeedMph = Math.round(current.wind?.speed ?? 0);
    const condition = current.weather?.[0]?.description ?? "Clear";

    const alerts = buildAlerts({
      tempF,
      tempHighF: Math.round(tempHighF),
      tempLowF: Math.round(tempLowF),
      humidity,
      windSpeedMph,
      rainChance,
      heatRisk: record.heatRisk,
      frostRisk: record.frostRisk,
    });

    const recommendedWateringAdjustment =
      alerts.find((a) => a.wateringAdjustment)?.wateringAdjustment ??
      "Water when the top inch of soil feels dry.";

    const location = `${zipProfile.city || geo.name}, ${zipProfile.state}`;
    const summary =
      alerts.length > 0
        ? `${location} — ${alerts[0].title}. ${recommendedWateringAdjustment}`
        : `${location} · ${tempF}°F · ${condition}.`;

    return enrichSnapshot(
      {
        location,
        zipCode,
        condition: condition.charAt(0).toUpperCase() + condition.slice(1),
        tempF,
        tempHighF: Math.round(tempHighF),
        tempLowF: Math.round(tempLowF),
        humidity,
        windSpeedMph,
        rainChance,
        recommendedWateringAdjustment,
        alerts,
        summary,
      },
      "live"
    );
  } catch (e) {
    console.error("[weather] OpenWeather error:", e);
    return null;
  }
}

async function fetchFromProvider(
  provider: WeatherProvider,
  zipCode: string
): Promise<WeatherInsights | null> {
  switch (provider) {
    case "openweather":
      return fetchOpenWeather(zipCode);
    case "weatherapi":
    case "noaa":
    case "tomorrow":
      return null;
    default:
      return null;
  }
}

/** Primary server-side weather fetch with mock fallback. */
export async function getWeatherByZip(zipCode: string): Promise<WeatherInsights> {
  const normalized = zipCode.trim().slice(0, 5);
  const cacheId = cacheKey(["weather", normalized, getWeatherProvider()]);
  const cached = cacheGet<WeatherInsights>(cacheId);
  if (cached) return cached;

  const provider = getWeatherProvider();
  if (provider !== "mock") {
    const live = await fetchFromProvider(provider, normalized);
    if (live) {
      recordDataSource("openweather", "real_api");
      cacheSet(cacheId, live, CACHE_TTL.weather);
      return live;
    }
    recordDataSourceError("openweather", "Live provider failed");
    recordDataSource("openweather", "mock", { fallback: true });
    console.warn("[weather] Live provider failed — using mock fallback for", normalized);
  } else {
    recordDataSource("openweather", "mock", { fallback: true });
  }

  const mock = buildMockWeather(normalized);
  cacheSet(cacheId, mock, CACHE_TTL.weather);
  return mock;
}

export const fetchWeatherForZip = getWeatherByZip;

/** Synchronous mock for legacy client paths — prefer /api/weather. */
export function getMockWeatherForZip(zipCode: string): WeatherInsights {
  return buildMockWeather(zipCode.trim().slice(0, 5));
}

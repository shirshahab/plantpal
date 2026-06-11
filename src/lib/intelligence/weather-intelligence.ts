/**
 * Weather intelligence: turns NOAA/NWS data (preferred) or OpenWeather
 * (fallback) into garden-specific WeatherRisk objects, and merges official
 * NWS alerts into the existing WeatherInsights alert list.
 *
 * OpenWeather stays in place. NOAA is additive.
 */

import type { WeatherAlert } from "@/lib/types/phase6";
import type { WeatherInsights } from "@/lib/types/integrations";
import type { NoaaWeather, NwsAlert, NwsForecastPeriod } from "./noaa";
import { getNoaaWeatherByZip } from "./noaa";
import type { WeatherRisk } from "./source-types";

function parseMaxWind(windSpeed: string): number {
  const numbers = windSpeed.match(/\d+/g);
  if (!numbers) return 0;
  return Math.max(...numbers.map(Number));
}

function pop(period: NwsForecastPeriod): number {
  return period.probabilityOfPrecipitation?.value ?? 0;
}

/** Derive garden risks from an NWS forecast + active alerts. */
export function deriveNoaaRisks(noaa: NoaaWeather): WeatherRisk[] {
  const risks: WeatherRisk[] = [];
  const periods = noaa.periods.slice(0, 14);

  // Official alerts first: highest trust.
  for (const alert of noaa.alerts) {
    const mapped = mapNwsAlertToRisk(alert);
    if (mapped) risks.push(mapped);
  }

  const hasKind = (kind: WeatherRisk["kind"]) => risks.some((r) => r.kind === kind);

  const hotDay = periods.find((p) => p.isDaytime && p.temperature >= 95);
  if (hotDay && !hasKind("heat")) {
    risks.push({
      kind: "heat",
      severity: hotDay.temperature >= 100 ? "critical" : "warning",
      title: `Heat ahead: ${hotDay.temperature}F ${hotDay.name.toLowerCase()}`,
      message: `Heat alert ${hotDay.name.toLowerCase()}. Container plants may need a morning soil check.`,
      action: "Water deeply in the early morning and check pots again by evening.",
      source: "noaa",
      confidence: "high",
      startsAt: hotDay.startTime,
    });
  }

  const coldNight = periods.find((p) => !p.isDaytime && p.temperature <= 36);
  if (coldNight && !hasKind("frost")) {
    risks.push({
      kind: "frost",
      severity: coldNight.temperature <= 32 ? "critical" : "warning",
      title: `Cold night ahead: ${coldNight.temperature}F ${coldNight.name.toLowerCase()}`,
      message: `Frost risk ${coldNight.name.toLowerCase()}. Tender plants and citrus need cover or shelter.`,
      action: "Move pots inside or cover sensitive plants before sunset.",
      source: "noaa",
      confidence: "high",
      startsAt: coldNight.startTime,
    });
  }

  const windyPeriod = periods.find((p) => parseMaxWind(p.windSpeed) >= 25);
  if (windyPeriod && !hasKind("wind")) {
    risks.push({
      kind: "wind",
      severity: parseMaxWind(windyPeriod.windSpeed) >= 40 ? "warning" : "info",
      title: `Wind picking up ${windyPeriod.name.toLowerCase()}`,
      message: "Wind is picking up. Check young trees and loose stakes.",
      action: "Stake tall plants and move lightweight pots out of the gusts.",
      source: "noaa",
      confidence: "high",
      startsAt: windyPeriod.startTime,
    });
  }

  const rainyPeriod = periods.slice(0, 4).find((p) => pop(p) >= 60);
  if (rainyPeriod && !hasKind("rain")) {
    risks.push({
      kind: "rain",
      severity: "info",
      title: `Rain likely ${rainyPeriod.name.toLowerCase()} (${pop(rainyPeriod)}%)`,
      message: `Rain is likely ${rainyPeriod.name.toLowerCase()}. Skip scheduled watering and let the sky work.`,
      action: "Hold off on watering and check drainage in low spots.",
      source: "noaa",
      confidence: "high",
      startsAt: rainyPeriod.startTime,
    });
  }

  // Dry spell: a full forecast window with almost no rain chance.
  const dry = periods.length >= 10 && periods.every((p) => pop(p) < 20);
  if (dry && !hasKind("rain") && !hasKind("dry_spell")) {
    risks.push({
      kind: "dry_spell",
      severity: "info",
      title: "Dry stretch ahead",
      message: "No meaningful rain in the forecast this week. Your irrigation is the only water plants get.",
      action: "Deep water 2 to 3 times this week and mulch exposed soil.",
      source: "noaa",
      confidence: "medium",
    });
  }

  return risks;
}

function mapNwsAlertToRisk(alert: NwsAlert): WeatherRisk | null {
  const event = alert.event.toLowerCase();
  const severity: WeatherRisk["severity"] =
    alert.severity === "Extreme" || alert.severity === "Severe"
      ? "critical"
      : alert.severity === "Moderate"
        ? "warning"
        : "info";
  const base = {
    severity,
    title: alert.event,
    source: "noaa" as const,
    confidence: "verified" as const,
    startsAt: alert.onset ?? undefined,
    endsAt: alert.ends ?? undefined,
  };

  if (/heat/.test(event)) {
    return {
      ...base,
      kind: "heat",
      message: `${alert.event} in effect. Container plants may need a morning soil check.`,
      action: "Water early, add shade cloth on sensitive plants, skip fertilizing.",
    };
  }
  if (/frost|freeze/.test(event)) {
    return {
      ...base,
      kind: "frost",
      message: `${alert.event} in effect. Cover tender plants and bring pots in.`,
      action: "Cover or move sensitive plants before nightfall.",
    };
  }
  if (/wind|red flag/.test(event)) {
    return {
      ...base,
      kind: "wind",
      message: "Wind is picking up. Check young trees and loose stakes.",
      action: "Stake tall plants and secure lightweight containers.",
    };
  }
  if (/flood|rain|storm|hurricane|tropical/.test(event)) {
    return {
      ...base,
      kind: "rain",
      message: `${alert.event} in effect. Skip watering and check drainage.`,
      action: "Hold watering, clear drains, and move pots out of pooling spots.",
    };
  }
  return null;
}

/** Fallback: derive risks from the existing OpenWeather/mock alert list. */
export function deriveOpenWeatherRisks(weather: WeatherInsights): WeatherRisk[] {
  const kindOf: Record<WeatherAlert["type"], WeatherRisk["kind"]> = {
    heat: "heat",
    frost: "frost",
    wind: "wind",
    rain: "rain",
    humidity: "humidity",
    drought: "dry_spell",
  };
  return weather.alerts.map((alert) => ({
    kind: kindOf[alert.type] ?? "rain",
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    action: alert.wateringAdjustment,
    source: weather.source === "live" ? "openweather" : "climate-model",
    confidence: weather.source === "live" ? "high" : "estimated",
  }));
}

/**
 * Best-available weather risks for a ZIP: NOAA first, OpenWeather/mock
 * insights as fallback. Pass the already-fetched insights to avoid a
 * duplicate OpenWeather call.
 */
export async function getWeatherRisks(
  zipCode: string,
  fallbackWeather?: WeatherInsights | null
): Promise<{ risks: WeatherRisk[]; provider: "noaa" | "openweather" | "climate-model" | "none" }> {
  const noaa = await getNoaaWeatherByZip(zipCode);
  if (noaa) {
    const risks = deriveNoaaRisks(noaa);
    if (risks.length > 0) return { risks, provider: "noaa" };
  }
  if (fallbackWeather) {
    return {
      risks: deriveOpenWeatherRisks(fallbackWeather),
      provider: fallbackWeather.source === "live" ? "openweather" : "climate-model",
    };
  }
  return { risks: [], provider: noaa ? "noaa" : "none" };
}

/**
 * Merge NOAA-derived risks into the existing WeatherInsights alert list
 * (the shape the task engine and dashboard already consume). Existing
 * OpenWeather alerts are kept; NOAA fills gaps with official data.
 */
export function mergeRisksIntoWeather(
  weather: WeatherInsights,
  risks: WeatherRisk[]
): WeatherInsights {
  const riskKindToAlertType: Record<WeatherRisk["kind"], WeatherAlert["type"]> = {
    heat: "heat",
    frost: "frost",
    wind: "wind",
    rain: "rain",
    humidity: "humidity",
    dry_spell: "drought",
  };

  const existing = new Set(weather.alerts.map((a) => a.type));
  const additions: WeatherAlert[] = [];
  for (const risk of risks) {
    const type = riskKindToAlertType[risk.kind];
    if (existing.has(type)) continue;
    existing.add(type);
    additions.push({
      type,
      severity: risk.severity,
      title: risk.title,
      message: risk.message,
      wateringAdjustment: risk.action,
    });
  }

  if (additions.length === 0) return weather;
  return { ...weather, alerts: [...weather.alerts, ...additions] };
}

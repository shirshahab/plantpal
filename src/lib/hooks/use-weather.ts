"use client";

import { useEffect, useState } from "react";
import { fetchWeatherByZip } from "@/lib/integrations/client";
import { getMockWeatherForZip } from "@/lib/integrations/weather";
import type { WeatherInsights } from "@/lib/types/integrations";

const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;

// Several dashboard sections request weather for the same zip on mount —
// share one request and cache the result instead of hitting the API per hook.
const weatherCache = new Map<string, { at: number; data: WeatherInsights }>();
const inFlight = new Map<string, Promise<WeatherInsights>>();

function getWeatherShared(zipCode: string): Promise<WeatherInsights> {
  const cached = weatherCache.get(zipCode);
  if (cached && Date.now() - cached.at < WEATHER_CACHE_TTL_MS) {
    return Promise.resolve(cached.data);
  }

  const pending = inFlight.get(zipCode);
  if (pending) return pending;

  const request = fetchWeatherByZip(zipCode)
    .then((data) => {
      weatherCache.set(zipCode, { at: Date.now(), data });
      return data;
    })
    .finally(() => {
      inFlight.delete(zipCode);
    });
  inFlight.set(zipCode, request);
  return request;
}

export function useWeather(zipCode: string) {
  const [weather, setWeather] = useState<WeatherInsights>(() => {
    const cached = weatherCache.get(zipCode);
    if (cached && Date.now() - cached.at < WEATHER_CACHE_TTL_MS) return cached.data;
    return getMockWeatherForZip(zipCode);
  });
  const [loading, setLoading] = useState(() => {
    const cached = weatherCache.get(zipCode);
    return !(cached && Date.now() - cached.at < WEATHER_CACHE_TTL_MS);
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getWeatherShared(zipCode)
      .then((data) => {
        if (!cancelled) setWeather(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [zipCode]);

  return { weather, loading };
}

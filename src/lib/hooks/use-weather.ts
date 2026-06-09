"use client";

import { useEffect, useState } from "react";
import { fetchWeatherByZip } from "@/lib/integrations/client";
import { getMockWeatherForZip } from "@/lib/integrations/weather";
import type { WeatherInsights } from "@/lib/types/integrations";

export function useWeather(zipCode: string) {
  const [weather, setWeather] = useState<WeatherInsights>(() =>
    getMockWeatherForZip(zipCode)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchWeatherByZip(zipCode)
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

import { NextResponse } from "next/server";
import { getDataSourcesSnapshot } from "@/lib/data-sources/runtime";
import { cacheStats } from "@/lib/api/server-cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isOpenAIConfigured } from "@/lib/ai/openai";
import { isPerenualEnabled } from "@/lib/integrations/perenual";
import { isPlantNetEnabled } from "@/lib/integrations/plantnet";
import { isSerpApiEnabled } from "@/lib/integrations/plant-prices";
import { getWeatherProvider } from "@/lib/integrations/weather";
import { isOpenWeatherKeyConfigured } from "@/lib/integrations/env-config";

export async function GET() {
  const sources = getDataSourcesSnapshot();
  const cache = cacheStats();

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: {
      supabase: isSupabaseConfigured(),
      openai: isOpenAIConfigured(),
      openweather: isOpenWeatherKeyConfigured(),
      weatherProvider: getWeatherProvider(),
      perenual: isPerenualEnabled(),
      plantnet: isPlantNetEnabled(),
      plantid: Boolean(process.env.PLANT_ID_API_KEY?.trim()),
      serpapi: isSerpApiEnabled(),
    },
    cache,
    sources,
  });
}

import { NextResponse } from "next/server";
import { getWeatherByZip } from "@/lib/integrations/weather";
import { getNoaaWeatherByZip } from "@/lib/intelligence/noaa";
import {
  deriveNoaaRisks,
  mergeRisksIntoWeather,
} from "@/lib/intelligence/weather-intelligence";

export async function POST(request: Request) {
  let body: { zip_code?: string };
  try {
    body = (await request.json()) as { zip_code?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const zip = body.zip_code?.trim().slice(0, 5);
  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ ok: false, error: "zip_code is required" }, { status: 400 });
  }

  try {
    // OpenWeather (or climate mock) is the base; NOAA/NWS enriches the
    // alert list with official data. NOAA failures never break the response.
    const [weather, noaa] = await Promise.all([
      getWeatherByZip(zip),
      getNoaaWeatherByZip(zip).catch(() => null),
    ]);

    const data = noaa ? mergeRisksIntoWeather(weather, deriveNoaaRisks(noaa)) : weather;
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[api/weather]", e);
    return NextResponse.json({ ok: false, error: "Weather lookup failed" }, { status: 500 });
  }
}

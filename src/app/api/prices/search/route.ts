import { NextResponse } from "next/server";
import { searchPlantPrices } from "@/lib/integrations/plant-prices";
import { cacheGet, cacheSet, cacheKey, CACHE_TTL } from "@/lib/api/server-cache";
import {
  checkRateLimit,
  dailyLimitKey,
  getClientKey,
  RATE_LIMITS,
} from "@/lib/api/rate-limit";
import type { NurserySize } from "@/lib/types/price-checker";

export async function POST(request: Request) {
  let body: { plantName?: string; size?: string; zipCode?: string };
  try {
    body = (await request.json()) as { plantName?: string; size?: string; zipCode?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const plantName = body.plantName?.trim();
  const zipCode = body.zipCode?.trim().slice(0, 5);
  const size = (body.size?.trim() || "1 gallon") as NurserySize;

  if (!plantName) {
    return NextResponse.json({ ok: false, error: "plantName is required" }, { status: 400 });
  }
  if (!zipCode || !/^\d{5}$/.test(zipCode)) {
    return NextResponse.json({ ok: false, error: "zipCode is required" }, { status: 400 });
  }

  const clientKey = getClientKey(request);
  const burst = checkRateLimit(
    `price-burst:${clientKey}`,
    RATE_LIMITS.priceSearchBurst,
    RATE_LIMITS.priceSearchBurstWindowMs
  );
  if (!burst.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many price checks — wait a minute and try again." },
      { status: 429 }
    );
  }

  const daily = checkRateLimit(
    dailyLimitKey("price-search", clientKey),
    RATE_LIMITS.priceSearchDaily,
    24 * 60 * 60 * 1000
  );
  if (!daily.allowed) {
    return NextResponse.json(
      { ok: false, error: "Daily price search limit reached. Try again tomorrow." },
      { status: 429 }
    );
  }

  const cacheId = cacheKey(["price-search", plantName.toLowerCase(), size, zipCode]);
  const cached = cacheGet<Awaited<ReturnType<typeof searchPlantPrices>>>(cacheId);
  if (cached) {
    return NextResponse.json({ ok: true, data: cached, cached: true });
  }

  try {
    const data = await searchPlantPrices({ plantName, size, zipCode });
    cacheSet(cacheId, data, CACHE_TTL.priceSearch);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[api/prices/search]", e);
    return NextResponse.json({ ok: false, error: "Price search failed" }, { status: 500 });
  }
}

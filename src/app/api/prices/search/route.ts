import { NextResponse } from "next/server";
import { searchPlantPrices } from "@/lib/integrations/plant-prices";
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

  try {
    const data = await searchPlantPrices({ plantName, size, zipCode });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[api/prices/search]", e);
    return NextResponse.json({ ok: false, error: "Price search failed" }, { status: 500 });
  }
}

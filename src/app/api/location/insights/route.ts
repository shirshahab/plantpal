import { NextResponse } from "next/server";
import { getLocalInsights } from "@/lib/location/location-service";
import type { Plant } from "@/lib/types";
import type { LocationInsightsRequest } from "@/lib/types/location";

export async function POST(request: Request) {
  let body: LocationInsightsRequest;
  try {
    body = (await request.json()) as LocationInsightsRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const zip = body.zip_code?.trim().slice(0, 5);
  if (!zip || zip.length < 5) {
    return NextResponse.json({ ok: false, error: "zip_code is required" }, { status: 400 });
  }

  const plants: Plant[] = (body.plants ?? []).map((p, i) => ({
    id: p.id ?? `temp-${i}`,
    name: p.name,
    species: p.species,
    image: "",
    locationType: (p.locationType as Plant["locationType"]) ?? "outdoor",
    plantingType: (p.plantingType as Plant["plantingType"]) ?? "pot",
    zipCode: zip,
    sunExposure: (p.sunExposure as Plant["sunExposure"]) ?? "partial_sun",
    waterFrequencyDays: 7,
    fertilizeFrequencyWeeks: 8,
    pruneSchedule: "Early spring",
    healthStatus: "healthy",
    healthNotes: "",
    wateringInstructions: "",
    fertilizingInstructions: "",
    pruningInstructions: "",
    lastWateredAt: null,
    lastFertilizedAt: null,
    createdAt: new Date().toISOString(),
  }));

  const insights = await getLocalInsights(zip, plants);

  return NextResponse.json({ ok: true, data: insights });
}

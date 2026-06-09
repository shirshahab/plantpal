import { NextResponse } from "next/server";
import { getPlantSpeciesDetail } from "@/lib/knowledge/queries";
import {
  getPlantDetails,
  getPlantCareGuide,
  parsePerenualId,
} from "@/lib/integrations/perenual";

export async function POST(request: Request) {
  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
  }

  try {
    const perenualId = parsePerenualId(id);
    if (perenualId !== null) {
      const [species, careGuide] = await Promise.all([
        getPlantDetails(perenualId),
        getPlantCareGuide(perenualId),
      ]);
      if (!species) {
        return NextResponse.json({ ok: false, error: "Species not found" }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        data: { species, careGuide, source: "perenual" },
      });
    }

    const detail = await getPlantSpeciesDetail(id);
    if (!detail) {
      return NextResponse.json({ ok: false, error: "Species not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      data: { species: detail, careGuide: detail.care_guide, source: "plantpal" },
    });
  } catch (e) {
    console.error("[api/plants/details]", e);
    return NextResponse.json({ ok: false, error: "Details lookup failed" }, { status: 500 });
  }
}

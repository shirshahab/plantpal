import { NextResponse } from "next/server";
import { importPerenualSpecies, resolveSpeciesId } from "@/lib/knowledge/import-species";
import { parsePerenualId } from "@/lib/integrations/perenual";

export async function POST(request: Request) {
  let body: { id?: string; perenual_id?: number };
  try {
    body = (await request.json()) as { id?: string; perenual_id?: number };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    let species = null;

    if (typeof body.perenual_id === "number") {
      species = await importPerenualSpecies(body.perenual_id);
    } else if (body.id) {
      const perenualId = parsePerenualId(body.id);
      if (perenualId !== null) {
        species = await importPerenualSpecies(perenualId);
      } else {
        species = await resolveSpeciesId(body.id);
      }
    }

    if (!species) {
      return NextResponse.json({ ok: false, error: "Could not import species" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: species });
  } catch (e) {
    console.error("[api/plants/import]", e);
    return NextResponse.json({ ok: false, error: "Import failed" }, { status: 500 });
  }
}

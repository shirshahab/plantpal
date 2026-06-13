import { NextResponse } from "next/server";
import { getDashboardIntelligenceContext } from "@/lib/intelligence/dashboard-insights";
import { lookupZipRecord } from "@/lib/location/usda-zones";

export const dynamic = "force-dynamic";

/** Server-only dashboard intelligence (F5Bot mentions from Supabase). */
export async function POST(request: Request) {
  let body: { zip_code?: string; city?: string; zone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const zip = body.zip_code?.trim().slice(0, 5);
  let city = body.city?.trim();
  let zone = body.zone?.trim();

  if (zip && /^\d{5}$/.test(zip)) {
    const record = lookupZipRecord(zip);
    city = city || record.city || undefined;
    zone = zone || record.usdaZone || undefined;
  }

  try {
    const context = await getDashboardIntelligenceContext({
      city,
      zone,
      zipCode: zip,
    });
    return NextResponse.json({
      ok: true,
      data: {
        ...context,
        city: city ?? null,
        zone: zone ?? null,
      },
    });
  } catch (e) {
    console.error("[api/intelligence/dashboard-context]", e);
    return NextResponse.json({ ok: false, error: "Dashboard context failed" }, { status: 500 });
  }
}

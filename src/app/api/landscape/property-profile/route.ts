import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { LandscapePropertyProfile } from "@/lib/landscape/types";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, profile: null, storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, profile: null });
  }

  const { data } = await supabase
    .from("landscape_property_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ ok: true, profile: null });
  }

  const profile: LandscapePropertyProfile = {
    zipCode: data.zip_code,
    hardinessZone: data.hardiness_zone ?? "",
    sunExposure: data.sun_exposure,
    yardSize: data.yard_size,
    budgetTier: data.budget_tier,
    maintenancePreference: data.maintenance_preference,
  };

  return NextResponse.json({ ok: true, profile, storage: "supabase" as const });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const profile = body.profile as LandscapePropertyProfile | undefined;
  if (!profile?.zipCode) {
    return NextResponse.json({ ok: false, error: "profile required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, storage: "local" as const });
  }

  const { error } = await supabase.from("landscape_property_profiles").upsert({
    user_id: user.id,
    zip_code: profile.zipCode,
    hardiness_zone: profile.hardinessZone,
    sun_exposure: profile.sunExposure,
    yard_size: profile.yardSize,
    budget_tier: profile.budgetTier,
    maintenance_preference: profile.maintenancePreference,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[landscape/property-profile]", error.message);
    return NextResponse.json({ ok: true, storage: "local" as const });
  }

  return NextResponse.json({ ok: true, storage: "supabase" as const });
}

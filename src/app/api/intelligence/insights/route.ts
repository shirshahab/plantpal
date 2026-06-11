import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getLocalInsights, type LocalInsightsBundle } from "@/lib/intelligence/local-insights";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** In-memory cache: intelligence sources are slow-moving. */
const cache = new Map<string, { bundle: LocalInsightsBundle; expires: number }>();
const TTL_MS = 15 * 60 * 1000;

function writeThroughCache(zip: string, bundle: LocalInsightsBundle): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!isSupabaseConfigured() || !url || !key) return;
  try {
    const admin = createSupabaseClient(url, key, { auth: { persistSession: false } });
    void admin
      .from("local_insights_cache")
      .upsert(
        {
          zip_code: zip,
          insights: bundle.insights,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + TTL_MS).toISOString(),
        },
        { onConflict: "zip_code" }
      )
      .then(() => undefined);
  } catch {
    /* cache table is optional */
  }
}

export async function POST(request: Request) {
  let body: { zip_code?: string; plants?: { name?: string; species?: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const zip = body.zip_code?.trim().slice(0, 5);
  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ ok: false, error: "zip_code is required" }, { status: 400 });
  }

  const plants = (body.plants ?? [])
    .filter((p) => p.species || p.name)
    .map((p) => ({ name: p.name ?? "", species: p.species ?? p.name ?? "" }))
    .slice(0, 20);

  const cacheKey = `${zip}|${plants.map((p) => p.species).sort().join(",")}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json({ ok: true, data: hit.bundle, cached: true });
  }

  try {
    const bundle = await getLocalInsights({ zip, plants });
    cache.set(cacheKey, { bundle, expires: Date.now() + TTL_MS });
    if (cache.size > 200) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    writeThroughCache(zip, bundle);
    return NextResponse.json({ ok: true, data: bundle });
  } catch (e) {
    console.error("[api/intelligence/insights]", e);
    return NextResponse.json({ ok: false, error: "Insights lookup failed" }, { status: 500 });
  }
}

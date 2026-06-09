import type { SupabaseClient } from "@supabase/supabase-js";
import { isOpenAIConfigured } from "@/lib/ai/openai";
import { isPerenualEnabled } from "@/lib/integrations/perenual";
import { isPlantNetEnabled } from "@/lib/integrations/plantnet";
import { isSerpApiEnabled } from "@/lib/integrations/plant-prices";
import { getWeatherProvider } from "@/lib/integrations/weather";
import {
  getSupabasePublicConfig,
  isMockMode,
  isSupabaseConfigured,
  maskAnonKey,
} from "@/lib/supabase/config";
import { probeTable } from "@/lib/supabase/diagnostics";
import type { SetupCheckItem, SetupCheckReport, SetupStatus } from "./types";

const REQUIRED_TABLES = [
  "profiles",
  "plants",
  "plant_photos",
  "plant_tasks",
  "plant_care_logs",
  "user_reminder_settings",
  "plant_species",
  "health_reports",
] as const;

function item(
  id: string,
  label: string,
  status: SetupStatus,
  message: string,
  fix?: string
): SetupCheckItem {
  return { id, label, status, message, fix };
}

function worstStatus(items: SetupCheckItem[]): SetupStatus {
  if (items.some((i) => i.status === "fail")) return "fail";
  if (items.some((i) => i.status === "warn")) return "warn";
  return "ok";
}

export async function runSetupCheck(
  supabase: SupabaseClient | null
): Promise<SetupCheckReport> {
  const checks: SetupCheckItem[] = [];
  const mock = isMockMode();
  const { url, key } = getSupabasePublicConfig();

  checks.push(
    item(
      "supabase-url",
      "Supabase URL",
      url ? "ok" : "fail",
      url ? `Configured (${url})` : "NEXT_PUBLIC_SUPABASE_URL is missing.",
      "Add NEXT_PUBLIC_SUPABASE_URL to .env.local from Supabase → Settings → API."
    )
  );

  checks.push(
    item(
      "supabase-anon-key",
      "Supabase anon key",
      key && key.length > 20 ? "ok" : "fail",
      key ? `Configured (${maskAnonKey(key)})` : "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.",
      "Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart npm run dev."
    )
  );

  if (mock) {
    checks.push(
      item(
        "app-mode",
        "App mode",
        "warn",
        "Running in local mock mode — data stays in this browser.",
        "Add Supabase env vars to enable cloud sync and multi-device testing."
      )
    );
  } else {
    checks.push(
      item("app-mode", "App mode", "ok", "Supabase mode — cloud sync enabled when signed in.")
    );
  }

  let userId: string | null = null;
  if (supabase && isSupabaseConfigured()) {
    const { data: { user }, error } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    checks.push(
      item(
        "auth",
        "User signed in",
        user ? "ok" : "warn",
        user ? `Signed in as ${user.email ?? user.id}` : "Not signed in — RLS-protected saves will fail.",
        user ? undefined : "Go to /login and create an account before testing cloud save."
      )
    );
    if (error) {
      checks.push(
        item("auth-error", "Auth session", "fail", error.message, "Clear cookies and sign in again.")
      );
    }
  } else {
    checks.push(
      item(
        "auth",
        "User signed in",
        "skip",
        "Skipped — mock mode does not require auth.",
      )
    );
  }

  if (supabase && isSupabaseConfigured()) {
    const tableResults = await Promise.all(
      REQUIRED_TABLES.map((t) => probeTable(supabase, t))
    );

    for (const probe of tableResults) {
      checks.push(
        item(
          `table-${probe.table}`,
          `Table: ${probe.table}`,
          probe.ok ? "ok" : "fail",
          probe.ok
            ? "Accessible via API"
            : probe.error?.message ?? "Table probe failed",
          probe.ok
            ? undefined
            : "Run supabase/FIX_RUN_THIS.sql in Supabase SQL Editor, then restart npm run dev."
        )
      );
    }

    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    const hasBucket = buckets?.some((b) => b.id === "plant-photos") ?? false;
    checks.push(
      item(
        "storage-bucket",
        "Storage: plant-photos",
        hasBucket ? "ok" : bucketError ? "warn" : "fail",
        hasBucket
          ? "Bucket exists"
          : bucketError
            ? `Could not list buckets: ${bucketError.message}`
            : "Bucket plant-photos not found.",
        hasBucket
          ? undefined
          : "Run the storage section in supabase/FIX_RUN_THIS.sql."
      )
    );

    if (userId) {
      const { error: rlsError } = await supabase.from("plants").select("id").limit(1);
      checks.push(
        item(
          "rls-read",
          "RLS read (plants)",
          rlsError ? "fail" : "ok",
          rlsError ? rlsError.message : "Authenticated read allowed.",
          rlsError ? "Re-run FIX_RUN_THIS.sql RLS policies; sign out and back in." : undefined
        )
      );
    } else {
      checks.push(
        item(
          "rls-read",
          "RLS read (plants)",
          "skip",
          "Sign in to test row-level security.",
        )
      );
    }
  } else {
    checks.push(
      item(
        "tables",
        "Database tables",
        "skip",
        "Skipped in mock mode — using localStorage.",
        "Configure Supabase to test cloud tables."
      )
    );
  }

  checks.push(
    item(
      "openai",
      "OpenAI (server)",
      isOpenAIConfigured() ? "ok" : "warn",
      isOpenAIConfigured() ? "OPENAI_API_KEY configured" : "Not configured — AI uses smart mock.",
      isOpenAIConfigured() ? undefined : "Add OPENAI_API_KEY to .env.local for live vision and care plans."
    )
  );

  const weatherProvider = getWeatherProvider();
  const hasWeatherKey = Boolean(process.env.OPENWEATHER_API_KEY?.trim());
  checks.push(
    item(
      "weather",
      "OpenWeather (server)",
      hasWeatherKey && weatherProvider === "openweather" ? "ok" : "warn",
      hasWeatherKey
        ? `Configured (provider: ${weatherProvider})`
        : "Using mock weather — add OPENWEATHER_API_KEY + WEATHER_PROVIDER=openweather.",
      hasWeatherKey ? undefined : "See .env.local.example for weather vars."
    )
  );

  checks.push(
    item(
      "perenual",
      "Perenual plant API",
      isPerenualEnabled() ? "ok" : "warn",
      isPerenualEnabled() ? "PERENUAL_API_KEY configured" : "Optional — internal plant database only.",
    )
  );

  checks.push(
    item(
      "plantnet",
      "Pl@ntNet (server)",
      isPlantNetEnabled() ? "ok" : "warn",
      isPlantNetEnabled() ? "PLANTNET_API_KEY configured" : "Optional — OpenAI Vision is primary for scans.",
    )
  );

  checks.push(
    item(
      "serpapi",
      "SerpAPI prices (server)",
      isSerpApiEnabled() ? "ok" : "warn",
      isSerpApiEnabled() ? "SERPAPI_KEY configured" : "Optional — price checker uses estimated ranges.",
    )
  );

  return {
    overall: worstStatus(checks),
    mode: mock ? "mock" : "supabase",
    checks,
    checkedAt: new Date().toISOString(),
  };
}

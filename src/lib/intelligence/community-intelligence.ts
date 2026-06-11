/**
 * Community intelligence: aggregate, anonymous PlantPal usage signals.
 *
 * Privacy rules (non-negotiable):
 * - Aggregate counts only. No names, photos, addresses, or user identity.
 * - Location is at most a 3-digit ZIP prefix + city/state.
 * - Signals with tiny counts are never surfaced individually.
 * - Never invent fake users or fake activity.
 *
 * Server-side only (service role writes; aggregate reads are public-safe).
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CommunitySignal, CommunitySignalType } from "./source-types";

/** Minimum aggregate count before a signal is shown to users. */
export const MIN_SURFACED_COUNT = 3;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!isSupabaseConfigured() || !url || !key) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

/** Current weekly aggregation period (Mon..Sun, UTC). */
export function currentPeriod(now = new Date()): { start: string; end: string } {
  const day = now.getUTCDay() || 7;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1));
  const end = new Date(start.getTime() + 7 * 86_400_000 - 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export interface RecordSignalInput {
  signalType: CommunitySignalType;
  plantSpecies?: string | null;
  issue?: string | null;
  zipCode?: string | null;
  city?: string | null;
  state?: string | null;
}

function zipPrefixOf(zip?: string | null): string | null {
  const normalized = zip?.trim() ?? "";
  return /^\d{5}$/.test(normalized) ? normalized.slice(0, 3) : null;
}

/**
 * Record one aggregate signal: increments the count for this
 * (type, species, issue, zip prefix, week) bucket. No user identity stored.
 */
export async function recordCommunitySignal(input: RecordSignalInput): Promise<boolean> {
  const client = getServiceClient();
  if (!client) return false;

  const period = currentPeriod();
  const row = {
    signal_type: input.signalType,
    plant_species: input.plantSpecies?.trim().toLowerCase().slice(0, 80) || null,
    issue: input.issue?.trim().toLowerCase().slice(0, 80) || null,
    zip_prefix: zipPrefixOf(input.zipCode),
    city: input.city?.trim().slice(0, 60) || null,
    state: input.state?.trim().slice(0, 20) || null,
    period_start: period.start,
    period_end: period.end,
  };

  try {
    let query = client
      .from("community_signals")
      .select("id, count")
      .eq("signal_type", row.signal_type)
      .eq("period_start", row.period_start);
    query = row.plant_species === null
      ? query.is("plant_species", null)
      : query.eq("plant_species", row.plant_species);
    query = row.issue === null ? query.is("issue", null) : query.eq("issue", row.issue);
    query = row.zip_prefix === null
      ? query.is("zip_prefix", null)
      : query.eq("zip_prefix", row.zip_prefix);

    const { data: existing } = await query.limit(1).maybeSingle();

    if (existing) {
      await client
        .from("community_signals")
        .update({ count: existing.count + 1 })
        .eq("id", existing.id);
    } else {
      await client.from("community_signals").insert({ ...row, count: 1 });
    }
    return true;
  } catch (e) {
    console.warn("[community-intelligence] record failed:", e);
    return false;
  }
}

interface SignalRow {
  signal_type: CommunitySignalType;
  plant_species: string | null;
  issue: string | null;
  zip_prefix: string | null;
  city: string | null;
  state: string | null;
  count: number;
  period_start: string;
  period_end: string;
}

/**
 * Aggregate signals for the current period, optionally scoped to a ZIP
 * prefix. Only returns buckets above the surfacing threshold.
 */
export async function getCommunityAggregates(
  zipCode?: string | null
): Promise<CommunitySignal[]> {
  const client = getServiceClient();
  if (!client) return [];

  const period = currentPeriod();
  try {
    let query = client
      .from("community_signals")
      .select("signal_type, plant_species, issue, zip_prefix, city, state, count, period_start, period_end")
      .eq("period_start", period.start)
      .gte("count", MIN_SURFACED_COUNT)
      .order("count", { ascending: false })
      .limit(20);

    const prefix = zipPrefixOf(zipCode);
    if (prefix) query = query.eq("zip_prefix", prefix);

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as SignalRow[]).map((r) => ({
      signalType: r.signal_type,
      plantSpecies: r.plant_species,
      issue: r.issue,
      zipPrefix: r.zip_prefix,
      city: r.city,
      state: r.state,
      count: r.count,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      source: "community" as const,
      estimated: false,
    }));
  } catch {
    return [];
  }
}

/**
 * Scheduled housekeeping: prune aggregate rows older than 8 weeks and
 * return the current period's signal count. Safe to run from a cron.
 */
export async function aggregateCommunitySignals(): Promise<{
  pruned: boolean;
  currentPeriodSignals: number;
}> {
  const client = getServiceClient();
  if (!client) return { pruned: false, currentPeriodSignals: 0 };

  const cutoff = new Date(Date.now() - 8 * 7 * 86_400_000).toISOString();
  try {
    await client.from("community_signals").delete().lt("period_end", cutoff);
    const { count } = await client
      .from("community_signals")
      .select("id", { count: "exact", head: true })
      .eq("period_start", currentPeriod().start);
    return { pruned: true, currentPeriodSignals: count ?? 0 };
  } catch {
    return { pruned: false, currentPeriodSignals: 0 };
  }
}

/** Total signal rows, for the debug view. */
export async function getCommunitySignalCount(): Promise<number | null> {
  const client = getServiceClient();
  if (!client) return null;
  try {
    const { count } = await client
      .from("community_signals")
      .select("id", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return null;
  }
}

import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDebugToolingEnabled } from "@/lib/dev/dev-only";
import { probePlantPhotosBucket } from "@/lib/supabase/storage-probe";
import { PLANTPAL_STORAGE_KEYS } from "@/lib/dev/dev-tools";

export async function GET() {
  if (!isDebugToolingEnabled()) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const admin =
    url && serviceKey
      ? createSupabaseClient(url, serviceKey, { auth: { persistSession: false } })
      : null;

  const uid = user?.id ?? null;

  const counts: Record<string, number | null> = {
    plants: null,
    photos: null,
    journal: null,
    tasks: null,
    scans: null,
    notifications: null,
    communitySignals: null,
  };

  let profilePresent = false;
  let rlsDiscoverPolicy = false;

  if (uid && admin) {
    const [profile, plants, photos, journal, tasks, scans, notifs] = await Promise.all([
      admin.from("profiles").select("id, email, full_name, onboarding_complete, zip_code").eq("id", uid).maybeSingle(),
      admin.from("plants").select("id", { count: "exact", head: true }).eq("user_id", uid),
      admin.from("plant_photos").select("id", { count: "exact", head: true }).eq("user_id", uid),
      admin.from("plant_journal_entries").select("id", { count: "exact", head: true }).eq("user_id", uid),
      admin.from("plant_tasks").select("id", { count: "exact", head: true }).eq("user_id", uid),
      admin.from("scan_history").select("id", { count: "exact", head: true }).eq("user_id", uid),
      admin.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid),
    ]);

    profilePresent = Boolean(profile.data);
    counts.plants = plants.count;
    counts.photos = photos.count;
    counts.journal = journal.count;
    counts.tasks = tasks.count;
    counts.scans = scans.count;
    counts.notifications = notifs.count;
  }

  if (admin) {
    counts.communitySignals = (
      await admin.from("community_signals").select("id", { count: "exact", head: true })
    ).count;
  }

  let bucketStatus = { ok: false, detail: "Not probed" };
  if (url && admin) {
    try {
      const probe = await probePlantPhotosBucket(admin, { url });
      bucketStatus = {
        ok: probe.exists,
        detail: probe.exists
          ? "plant-photos bucket reachable"
          : (probe.debug.details.listBucketsError ?? probe.debug.storageError ?? "Bucket not found"),
      };
    } catch (e) {
      bucketStatus = { ok: false, detail: e instanceof Error ? e.message : "Probe failed" };
    }
  }

  return NextResponse.json({
    ok: true,
    authUserPresent: Boolean(user),
    profilePresent,
    counts,
    supabaseConfigured: isSupabaseConfigured(),
    serviceRoleConfigured: Boolean(serviceKey),
    storageBucket: bucketStatus,
    rlsDiscoverPolicy,
    localStorageKeysKnown: [...PLANTPAL_STORAGE_KEYS],
    missingIndexesWarning: [
      "Verify migration 030_storage_audit.sql applied for scale indexes",
      "scan_history table requires migration 030",
    ],
  });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Export all user-owned data as JSON (GDPR-style data portability). */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  const uid = user.id;

  const [
    profile,
    plants,
    photos,
    tasks,
    careLogs,
    journal,
    scans,
    healthReports,
    proReports,
    friends,
    friendRequests,
    reminderSettings,
    pushTokens,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("plants").select("*").eq("user_id", uid),
    supabase.from("plant_photos").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(500),
    supabase.from("plant_tasks").select("*").eq("user_id", uid).limit(500),
    supabase.from("plant_care_logs").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(500),
    supabase.from("plant_journal_entries").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(500),
    supabase.from("scan_history").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(100),
    supabase.from("health_reports").select("*").eq("user_id", uid).limit(100),
    supabase.from("pro_health_reports").select("*").eq("user_id", uid).limit(50),
    supabase.from("friends").select("*").or(`user_id.eq.${uid},friend_id.eq.${uid}`),
    supabase.from("friend_requests").select("*").or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`),
    supabase.from("user_reminder_settings").select("*").eq("user_id", uid).maybeSingle(),
    supabase.from("user_push_tokens").select("id, platform, created_at").eq("user_id", uid),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId: uid,
    email: user.email,
    profile: profile.data,
    plants: plants.data ?? [],
    photos: photos.data ?? [],
    tasks: tasks.data ?? [],
    careLogs: careLogs.data ?? [],
    journal: journal.data ?? [],
    scanHistory: scans.data ?? [],
    healthReports: healthReports.data ?? [],
    proHealthReports: proReports.data ?? [],
    friends: friends.data ?? [],
    friendRequests: friendRequests.data ?? [],
    reminderSettings: reminderSettings.data,
    pushTokens: pushTokens.data ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="plantpal-export-${uid.slice(0, 8)}.json"`,
    },
  });
}

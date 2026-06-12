import { NextResponse } from "next/server";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deriveUsername, repairProfileByUserId } from "@/lib/social/repair-profile";
import type { SocialProfile } from "@/lib/social/types";

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

function toProfile(row: ProfileRow): SocialProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    username: deriveUsername(row.email, row.full_name),
  };
}

const PROFILE_COLUMNS = "id, full_name, email, avatar_url";

function looksLikeEmail(q: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q);
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

/** Paginate auth.users until an exact email match is found (service role). */
async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string,
  excludeUserId: string
) {
  const normalized = email.toLowerCase();
  let page = 1;
  const perPage = 200;

  for (let i = 0; i < 10; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.warn("[users/search] listUsers failed:", error.message);
      return null;
    }
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === normalized && u.id !== excludeUserId
    );
    if (match) return match;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ ok: true, users: [] });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, users: [], storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  // Service role bypasses RLS so search works even if discover policy is missing.
  const admin = getAdminClient();
  const db = admin ?? supabase;

  const results = new Map<string, ProfileRow>();

  // 1. Exact email lookup (case-insensitive).
  if (looksLikeEmail(q)) {
    const { data, error } = await db
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .ilike("email", q)
      .neq("id", user.id)
      .limit(3);

    if (error) {
      console.error("[users/search] exact email lookup failed:", error.message);
      return NextResponse.json(
        { ok: false, error: "Search failed. Try again." },
        { status: 500 }
      );
    }

    for (const row of data ?? []) results.set(row.id, row);

    // If no profile row, try auth.users by exact email and repair.
    if (results.size === 0 && admin) {
      const email = q.toLowerCase();
      const match = await findAuthUserByEmail(admin, email, user.id);

      if (match) {
        await repairProfileByUserId(match.id);
        const { data: repaired } = await db
          .from("profiles")
          .select(PROFILE_COLUMNS)
          .eq("id", match.id)
          .maybeSingle();
        if (repaired) results.set(repaired.id, repaired);
      }
    }
  }

  // 2. Fuzzy name/email/username-style match.
  const pattern = `%${q.replace(/[%",\\]/g, "")}%`;
  const { data, error } = await db
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .or(`full_name.ilike."${pattern}",email.ilike."${pattern}"`)
    .neq("id", user.id)
    .limit(12);

  if (error) {
    console.error("[users/search] fuzzy lookup failed:", error.message);
    if (results.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Search failed. Try again." },
        { status: 500 }
      );
    }
  } else {
    for (const row of data ?? []) {
      if (!results.has(row.id)) results.set(row.id, row);
    }
  }

  const users = [...results.values()].slice(0, 12).map(toProfile);
  return NextResponse.json({ ok: true, users, storage: "supabase" as const });
}

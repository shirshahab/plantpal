import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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
  };
}

const PROFILE_COLUMNS = "id, full_name, email, avatar_url";

function looksLikeEmail(q: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q);
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

  const results = new Map<string, ProfileRow>();

  // 1. Exact email lookup first. This must always find a signed-up user,
  //    and ilike with no wildcards is a case-insensitive exact match.
  if (looksLikeEmail(q)) {
    const { data, error } = await supabase
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
  }

  // 2. Fuzzy name/email match. Keep underscores: they are valid in emails
  //    (as an ilike wildcard `_` just matches one char, which is harmless).
  //    Values are double-quoted so emails survive PostgREST's or() parser.
  const pattern = `%${q.replace(/[%",\\]/g, "")}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .or(`full_name.ilike."${pattern}",email.ilike."${pattern}"`)
    .neq("id", user.id)
    .limit(12);

  if (error) {
    console.error("[users/search] fuzzy lookup failed:", error.message);
    // If the exact lookup already found someone, return that instead of failing.
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

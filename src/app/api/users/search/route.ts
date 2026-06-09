import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SocialProfile } from "@/lib/social/types";

function toProfile(row: {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}): SocialProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url,
  };
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

  const pattern = `%${q.replace(/[%_]/g, "")}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
    .neq("id", user.id)
    .limit(12);

  if (error) {
    console.error("[users/search]", error.message);
    return NextResponse.json({ ok: true, users: [] });
  }

  const users = (data ?? []).map(toProfile);
  return NextResponse.json({ ok: true, users, storage: "supabase" as const });
}

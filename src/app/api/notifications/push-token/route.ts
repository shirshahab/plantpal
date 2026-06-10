import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const PLATFORMS = ["web-push", "expo", "ios", "android"] as const;

interface PushTokenBody {
  platform?: string;
  token?: string;
}

/** Register a device push token (web-push subscription or native token). */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PushTokenBody;
    const platform = body.platform?.trim() ?? "";
    const token = body.token?.trim() ?? "";

    if (!PLATFORMS.includes(platform as (typeof PLATFORMS)[number]) || !token) {
      return NextResponse.json(
        { ok: false, error: "platform and token are required." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
    }

    const { error } = await supabase
      .from("user_push_tokens")
      .upsert(
        { user_id: user.id, platform, token },
        { onConflict: "user_id,token", ignoreDuplicates: true }
      );

    if (error) {
      console.error("[push-token]", error.message);
      return NextResponse.json({ ok: false, error: "Could not save token." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, storage: "supabase" as const });
  } catch (e) {
    console.error("[push-token]", e);
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface ReferralBody {
  code: string;
  action?: "redeem" | "stats";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReferralBody;
    const code = body.code?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, error: "code required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    }

    if (body.action === "stats") {
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_code", code);
      return NextResponse.json({ ok: true, invites: count ?? 0 });
    }

    const { error } = await supabase.from("referrals").insert({
      referrer_code: code,
      invitee_user_id: user.id,
    });

    if (error) {
      console.error("[referrals]", error.message);
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    return NextResponse.json({ ok: true, storage: "supabase" as const });
  } catch (e) {
    console.error("[referrals]", e);
    return NextResponse.json({ ok: false, error: "Referral failed" }, { status: 500 });
  }
}

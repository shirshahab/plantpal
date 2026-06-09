import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface FeedbackBody {
  tried?: string;
  confused?: string;
  improvement?: string;
  message?: string;
  route?: string;
  email?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FeedbackBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Feedback message is required." },
        { status: 400 }
      );
    }

    const row = {
      user_id: null as string | null,
      email: body.email?.trim() || null,
      route: body.route?.trim() || null,
      feedback_type: "beta",
      message,
    };

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) row.user_id = user.id;

    const { error } = await supabase.from("beta_feedback").insert(row);

    if (error) {
      console.error("[feedback]", error.message);
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    return NextResponse.json({ ok: true, storage: "supabase" as const });
  } catch (e) {
    console.error("[feedback]", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

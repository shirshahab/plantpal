import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { BetaFeedbackCategory } from "@/lib/feedback/types";
import { getCategoryLabel } from "@/lib/feedback/types";

interface FeedbackBody {
  category?: BetaFeedbackCategory;
  /** Overrides the stored feedback_type (e.g. "support", "data_deletion"). */
  type?: string;
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
    let message = body.message?.trim();

    if (!message) {
      const parts: string[] = [];
      if (body.category) parts.push(`Category: ${getCategoryLabel(body.category)}`);
      if (body.tried?.trim()) parts.push(`What I tried: ${body.tried.trim()}`);
      if (body.confused?.trim()) parts.push(`What confused me: ${body.confused.trim()}`);
      if (body.improvement?.trim()) parts.push(`What would help: ${body.improvement.trim()}`);
      message = parts.join("\n\n");
    }

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
      feedback_type:
        body.type?.trim().slice(0, 40) ||
        (body.category ? `beta:${body.category}` : "beta"),
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

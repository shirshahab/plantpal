import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { WaitlistSubmitInput } from "@/lib/waitlist/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WaitlistSubmitInput;

    if (!body.email?.trim() || !body.name?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required." },
        { status: 400 }
      );
    }

    const row = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      zip_code: body.zip_code?.trim() || null,
      grow_types: body.grow_types ?? [],
      biggest_problem: body.biggest_problem ?? "other",
      source: body.source ?? "website",
    };

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("waitlist_signups").insert(row);

    if (error) {
      console.error("[waitlist]", error.message);
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    return NextResponse.json({ ok: true, storage: "supabase" as const });
  } catch (e) {
    console.error("[waitlist]", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface ErrorBody {
  message: string;
  stack?: string;
  route?: string;
  componentStack?: string;
  kind?: string;
  userAgent?: string;
  timestamp?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ErrorBody;
    if (!body.message?.trim()) {
      return NextResponse.json({ ok: false, error: "message required" }, { status: 400 });
    }

    const row = {
      message: body.message.slice(0, 2000),
      stack: body.stack?.slice(0, 8000) ?? null,
      route: body.route ?? null,
      component_stack: body.componentStack?.slice(0, 4000) ?? null,
      kind: body.kind ?? "error",
      user_agent: body.userAgent?.slice(0, 500) ?? null,
      user_id: null as string | null,
      created_at: body.timestamp ?? new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      console.error("[client-error]", row.message, row.route);
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) row.user_id = user.id;

    const { error } = await supabase.from("client_errors").insert(row);
    if (error) {
      console.error("[client-error]", error.message, row.message);
      return NextResponse.json({ ok: true, storage: "local" as const });
    }

    return NextResponse.json({ ok: true, storage: "supabase" as const });
  } catch (e) {
    console.error("[client-error]", e);
    return NextResponse.json({ ok: false, error: "Failed to log error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LANDSCAPE_PHOTOS_BUCKET } from "@/lib/landscape/photo-upload";

export async function POST(request: Request) {
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

  const form = await request.formData();
  const file = form.get("file");
  const slot = (form.get("slot") as string) ?? "yard";

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file required" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${slot}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(LANDSCAPE_PHOTOS_BUCKET)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    console.error("[landscape/photos]", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(LANDSCAPE_PHOTOS_BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, storage: "supabase" as const });
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface DigestItem {
  title: string;
  body: string;
}

/**
 * Email fallback for users without push permission.
 * Sends a daily digest via Resend when RESEND_API_KEY is configured;
 * otherwise acknowledges so the client doesn't retry all day.
 */
export async function POST(req: Request) {
  let email = "";
  let items: DigestItem[] = [];
  try {
    const body = (await req.json()) as { email?: string; items?: DigestItem[] };
    email = (body.email ?? "").trim();
    items = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!email || !email.includes("@") || items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Valid email and at least one item required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "Email provider not configured (set RESEND_API_KEY to enable sending).",
    });
  }

  const listHtml = items
    .map(
      (i) =>
        `<li style="margin-bottom:8px"><strong>${escapeHtml(i.title)}</strong><br/><span style="color:#555">${escapeHtml(i.body)}</span></li>`
    )
    .join("");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#166534">Your PlantPal reminders for today</h2>
      <ul style="padding-left:18px">${listHtml}</ul>
      <p style="color:#888;font-size:12px">
        You're getting this email because push notifications aren't enabled on your device.
        Manage reminders in PlantPal &rarr; Settings &rarr; Reminders.
      </p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NOTIFICATION_EMAIL_FROM ?? "PlantPal <reminders@plantpal.app>",
        to: [email],
        subject: `PlantPal: ${items[0].title}${items.length > 1 ? ` (+${items.length - 1} more)` : ""}`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { ok: false, sent: false, error: `Email provider error: ${detail.slice(0, 200)}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, sent: false, error: err instanceof Error ? err.message : "Send failed" },
      { status: 502 }
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

import { NextResponse } from "next/server";
import type { IdentifyPhotoRole } from "@/lib/ai/plant-identify";
import { parseJsonBody } from "@/lib/ai/parse-request-body";
import { runScannerDebug } from "@/lib/scanner/scanner-debug";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ROUTE = "api/debug/scanner";

function parseImages(body: Record<string, unknown>): {
  urls: string[];
  roles?: IdentifyPhotoRole[];
} {
  const roles = Array.isArray(body.photoRoles)
    ? (body.photoRoles.filter((r) =>
        r === "whole" || r === "leaf" || r === "flower"
      ) as IdentifyPhotoRole[])
    : undefined;

  if (Array.isArray(body.imageDataUrls)) {
    const urls = body.imageDataUrls.filter(
      (u): u is string => typeof u === "string" && u.startsWith("data:")
    );
    if (urls.length > 0) return { urls: urls.slice(0, 3), roles };
  }

  const single = body.imageDataUrl;
  if (typeof single === "string" && single.startsWith("data:")) {
    return { urls: [single], roles: roles?.length ? roles.slice(0, 1) : ["whole"] };
  }

  return { urls: [] };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: ROUTE,
    usage: "POST JSON with imageDataUrl or imageDataUrls (data URLs)",
  });
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, ROUTE);
  if (!parsed.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not parse request body as JSON",
        rejectionSource: parsed.rejectionSource,
        payloadBytes: parsed.payloadBytes,
      },
      { status: parsed.response.status }
    );
  }

  const { urls, roles } = parseImages(parsed.data.body);
  if (urls.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "At least one data: image URL is required (imageDataUrl or imageDataUrls)",
        payloadBytes: parsed.data.payloadBytes,
      },
      { status: 400 }
    );
  }

  const report = await runScannerDebug(urls, roles);

  return NextResponse.json({
    ok: report.final.success,
    payloadBytes: parsed.data.payloadBytes,
    report,
    failureReason: report.final.failureReason,
  });
}

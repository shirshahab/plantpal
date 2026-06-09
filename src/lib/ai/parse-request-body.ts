import { NextResponse } from "next/server";
import { FRIENDLY_ANALYSIS_FAILED, FRIENDLY_PAYLOAD_TOO_LARGE } from "@/lib/ai/messages";
import { aiError, logAnalysisFailure } from "@/lib/ai/route-utils";

export type RejectionSource = "vercel" | "openai" | "unknown";

export interface ParsedJsonBody {
  body: Record<string, unknown>;
  payloadBytes: number;
}

export function classifyBodyRejection(
  raw: string,
  payloadBytes: number
): RejectionSource {
  if (/request entity too large/i.test(raw)) return "vercel";
  // Vercel / Next default body limit is ~4.5 MB on serverless.
  if (payloadBytes > 4_500_000) return "vercel";
  return "unknown";
}

/** Parse POST JSON with server-side diagnostics when the body is not JSON. */
export async function parseJsonBody(
  request: Request,
  routeLabel: string
): Promise<
  | { ok: true; data: ParsedJsonBody }
  | { ok: false; response: NextResponse; payloadBytes: number; rejectionSource: RejectionSource }
> {
  let raw: string;
  try {
    raw = await request.text();
  } catch (error) {
    console.error(`[${routeLabel}] failed to read request body`, error);
    return {
      ok: false,
      payloadBytes: 0,
      rejectionSource: "unknown",
      response: aiError(FRIENDLY_PAYLOAD_TOO_LARGE, 413),
    };
  }

  const payloadBytes = new TextEncoder().encode(raw).length;
  const preview = raw.slice(0, 200);

  console.info(
    `[${routeLabel}] incoming payload ${payloadBytes} bytes (${(payloadBytes / (1024 * 1024)).toFixed(2)} MB)`
  );

  try {
    const body = JSON.parse(raw) as Record<string, unknown>;
    return { ok: true, data: { body, payloadBytes } };
  } catch (error) {
    const rejectionSource = classifyBodyRejection(raw, payloadBytes);
    const headers = Object.fromEntries(request.headers.entries());

    console.error(`[${routeLabel}] non-JSON request body`, {
      payloadBytes,
      rejectionSource,
      contentType: request.headers.get("content-type"),
      contentLength: request.headers.get("content-length"),
      requestHeaders: headers,
      bodyPreview: preview,
      parseError: error instanceof Error ? error.message : String(error),
    });

    const message =
      rejectionSource === "vercel" || /request entity too large/i.test(raw)
        ? FRIENDLY_PAYLOAD_TOO_LARGE
        : "Invalid request body.";

    return {
      ok: false,
      payloadBytes,
      rejectionSource,
      response: aiError(message, rejectionSource === "vercel" ? 413 : 400),
    };
  }
}

/** Log upstream HTTP failures (OpenAI, etc.) — server only. */
export function logUpstreamHttpFailure(
  routeLabel: string,
  context: {
    payloadBytes?: number;
    status: number;
    headers: Record<string, string> | Headers;
    bodyPreview: string;
    provider: string;
  }
) {
  const headerRecord =
    context.headers instanceof Headers
      ? Object.fromEntries(context.headers.entries())
      : context.headers;

  console.error(`[${routeLabel}] ${context.provider} rejected request`, {
    payloadBytes: context.payloadBytes,
    status: context.status,
    headers: headerRecord,
    bodyPreview: context.bodyPreview.slice(0, 200),
  });
}

export function handleAnalysisRouteError(
  routeLabel: string,
  error: unknown,
  payloadBytes?: number
): NextResponse {
  logAnalysisFailure(routeLabel, error, { payloadBytes });
  return aiError(FRIENDLY_ANALYSIS_FAILED, 500);
}

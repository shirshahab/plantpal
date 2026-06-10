export interface ClientErrorReport {
  message: string;
  stack?: string;
  route?: string;
  componentStack?: string;
  kind?:
    | "error"
    | "unhandledrejection"
    | "boundary"
    | "api_failure"
    | "scanner_failure"
    | "auth_failure";
  /** Feature area for triage, e.g. "scanner", "garden-designer". */
  feature?: string;
  userAgent?: string;
}

const ERROR_QUEUE_KEY = "plantpal-error-queue";

function enqueue(report: ClientErrorReport): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ERROR_QUEUE_KEY);
    const queue: ClientErrorReport[] = raw ? JSON.parse(raw) : [];
    queue.push({ ...report, userAgent: navigator.userAgent });
    localStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(queue.slice(-50)));
  } catch {
    /* ignore */
  }
}

/** Most recent client errors (newest last) — used in bug report diagnostics. */
export function getRecentClientErrors(limit = 3): ClientErrorReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ERROR_QUEUE_KEY);
    const queue: ClientErrorReport[] = raw ? JSON.parse(raw) : [];
    return queue.slice(-limit);
  } catch {
    return [];
  }
}

export function reportClientError(report: ClientErrorReport): void {
  if (typeof window === "undefined") return;
  enqueue(report);

  // Forward to Sentry when the SDK is loaded (NEXT_PUBLIC_SENTRY_DSN set).
  try {
    window.Sentry?.captureMessage(report.message, {
      level: "error",
      tags: { kind: report.kind ?? "error", feature: report.feature ?? "app" },
      extra: { stack: report.stack, route: report.route },
    });
  } catch {
    /* sentry optional */
  }

  void fetch("/api/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...report,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }),
    keepalive: true,
  }).catch(() => {
    /* offline */
  });
}

/**
 * Convenience wrapper for non-crash failures (API, scanner, auth) so they
 * reach the same monitoring pipeline with a feature tag for triage.
 */
export function reportFeatureFailure(
  feature: string,
  message: string,
  kind: "api_failure" | "scanner_failure" | "auth_failure" = "api_failure"
): void {
  reportClientError({
    message: `[${feature}] ${message}`,
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    kind,
    feature,
  });
}

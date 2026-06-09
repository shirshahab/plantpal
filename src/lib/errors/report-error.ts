export interface ClientErrorReport {
  message: string;
  stack?: string;
  route?: string;
  componentStack?: string;
  kind?: "error" | "unhandledrejection" | "boundary";
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

export function reportClientError(report: ClientErrorReport): void {
  if (typeof window === "undefined") return;
  enqueue(report);

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

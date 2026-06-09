"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/errors/report-error";

export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportClientError({
        message: event.message || "Unknown error",
        stack: event.error?.stack,
        route: window.location.pathname,
        kind: "error",
      });
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      reportClientError({
        message:
          reason instanceof Error
            ? reason.message
            : typeof reason === "string"
              ? reason
              : "Unhandled promise rejection",
        stack: reason instanceof Error ? reason.stack : undefined,
        route: window.location.pathname,
        kind: "unhandledrejection",
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return <>{children}</>;
}

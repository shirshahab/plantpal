"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/errors/report-error";

/**
 * Last-resort boundary for failures in the root layout itself.
 * Must render its own <html>/<body> and avoid app components/providers.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      message: error.message,
      stack: error.stack,
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      kind: "boundary",
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8faf8",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #f3f4f6",
            padding: 32,
          }}
        >
          <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>🌿</span>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111827", margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8, lineHeight: 1.6 }}>
            PlantPal hit an unexpected error. We&apos;ve logged it so we can fix it.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 24,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              style={{
                background: "#fff",
                color: "#374151",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/errors/report-error";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
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
    <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <span className="text-5xl block mb-4">🌿</span>
        <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          PlantPal hit an unexpected error. We&apos;ve logged it so we can fix it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

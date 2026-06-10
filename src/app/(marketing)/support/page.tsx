import type { Metadata } from "next";
import Link from "next/link";
import { SupportClient } from "./support-client";

export const metadata: Metadata = {
  title: "Support",
  description: "Contact PlantPal support, report a problem, or request data deletion.",
};

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <h1 className="text-3xl font-bold text-gray-900">Support</h1>
      <p className="text-gray-600 mt-4 leading-relaxed">
        Need help, found a bug, or want your data removed? You&apos;re in the right
        place. We read every message.
      </p>

      <div className="mt-8 space-y-3 text-gray-600 leading-relaxed">
        <p>
          <span className="font-semibold text-gray-900">Email:</span>{" "}
          <a
            href="mailto:support@plantpal.app"
            className="text-green-700 font-medium hover:underline"
          >
            support@plantpal.app
          </a>
        </p>
        <p>
          <span className="font-semibold text-gray-900">In the app:</span> Settings →
          Help &amp; Support lets you report bugs and request features with diagnostics
          attached automatically.
        </p>
      </div>

      <SupportClient />

      <p className="text-sm text-gray-400 mt-10">
        See also our{" "}
        <Link href="/privacy" className="text-green-700 hover:underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="text-green-700 hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "PlantPal terms of service.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
      <p className="text-gray-500 mt-4 leading-relaxed">
        By using PlantPal, you agree to use the app for personal plant care purposes. PlantPal
        provides guidance and suggestions — not professional agricultural, horticultural, or medical
        advice.
      </p>
      <p className="text-gray-500 mt-4 leading-relaxed">
        AI diagnosis and care plans are best-effort recommendations. Always use judgment for
        valuable plants, toxic species, and safety around children and pets.
      </p>
      <p className="text-sm text-gray-400 mt-8">
        This is a placeholder for early access. Full terms will be published before public launch.
      </p>
    </div>
  );
}

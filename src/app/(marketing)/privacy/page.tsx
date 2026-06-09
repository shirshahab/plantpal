import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "PlantPal privacy policy.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 prose prose-gray">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="text-gray-500 mt-4 leading-relaxed">
        PlantPal respects your privacy. We collect only the information needed to provide plant care
        guidance — such as your email for the waitlist, ZIP code for local advice, and plant data
        you choose to save.
      </p>
      <p className="text-gray-500 mt-4 leading-relaxed">
        We do not sell your personal information. Photos uploaded for diagnosis are used to
        generate care recommendations and are stored according to your account settings.
      </p>
      <p className="text-sm text-gray-400 mt-8">
        This is a placeholder policy for early access. A full policy will be published before public
        launch.
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of PlantPal.",
};

const SECTIONS = [
  {
    title: "1. The service",
    body: [
      "PlantPal provides plant identification, plant health guidance, care plans, reminders, learning content, and related features for personal, non-commercial gardening.",
    ],
  },
  {
    title: "2. Guidance, not professional advice",
    body: [
      "Identification results, diagnoses, care plans, and prognosis estimates are best-effort recommendations generated from photos and the information you provide. They are not professional agricultural, horticultural, veterinary, or medical advice, and no outcome is guaranteed.",
      "Always use your own judgment, especially with valuable plants, suspected toxic species, food crops, and safety around children and pets. For high-stakes decisions, consult a local professional.",
    ],
  },
  {
    title: "3. Your account",
    body: [
      "You are responsible for keeping your login credentials secure and for activity on your account. You must provide accurate information and be at least 13 years old to use PlantPal.",
    ],
  },
  {
    title: "4. Your content",
    body: [
      "You own the photos and content you upload. By uploading, you grant PlantPal a limited license to store and process that content to provide the service (for example, analyzing a photo to generate a diagnosis). If you share content to community features, other users you have connected with may see it.",
    ],
  },
  {
    title: "5. Acceptable use",
    body: [
      "Don't misuse the service: no unlawful content, no attempts to break or overload the service, no scraping other users' data, and no impersonation. We may suspend accounts that violate these rules.",
    ],
  },
  {
    title: "6. Subscriptions",
    body: [
      "Some features may require a paid subscription. Pricing and billing terms are presented before purchase. Features may change, be interrupted, or be discontinued as the product evolves.",
    ],
  },
  {
    title: "7. Disclaimers and limitation of liability",
    body: [
      "PlantPal is provided “as is” without warranties of any kind. To the maximum extent permitted by law, PlantPal is not liable for indirect, incidental, or consequential damages arising from use of the service, including loss of plants, crops, or data.",
    ],
  },
  {
    title: "8. Termination",
    body: [
      "You can stop using PlantPal and request account deletion at any time. We may suspend or terminate accounts that violate these terms.",
    ],
  },
  {
    title: "9. Changes",
    body: [
      "We may update these terms as the service evolves. For material changes we will notify you in the app before they take effect.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
      <p className="text-sm text-gray-400 mt-2">Effective June 1, 2026</p>
      <p className="text-gray-600 mt-6 leading-relaxed">
        Welcome to PlantPal. By creating an account or using the app, you agree to these
        terms.
      </p>

      {SECTIONS.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
          {s.body.map((p, i) => (
            <p key={i} className="text-gray-600 mt-3 leading-relaxed">
              {p}
            </p>
          ))}
        </section>
      ))}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">10. Contact</h2>
        <p className="text-gray-600 mt-3 leading-relaxed">
          Questions about these terms? Visit our{" "}
          <Link href="/support" className="text-green-700 font-medium hover:underline">
            Support page
          </Link>{" "}
          or email{" "}
          <a
            href="mailto:support@plantpal.app"
            className="text-green-700 font-medium hover:underline"
          >
            support@plantpal.app
          </a>
          .
        </p>
      </section>
    </div>
  );
}

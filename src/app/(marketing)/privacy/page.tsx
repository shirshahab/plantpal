import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PlantPal collects, uses, and protects your information.",
};

const SECTIONS = [
  {
    title: "1. Information we collect",
    body: [
      "Account information: your email address and display name when you create an account.",
      "Garden information: plants you add, care logs, photos you upload, your ZIP code (used for local weather and growing advice), and preferences you set.",
      "Photos: images you submit for plant identification or health diagnosis. These are processed to generate results and stored with your account so you can review past scans and reports.",
      "Usage and diagnostics: anonymous usage events (such as which features are used), crash reports, and error logs that help us keep the app reliable.",
      "Feedback: bug reports, feature requests, and messages you choose to send us.",
    ],
  },
  {
    title: "2. How we use your information",
    body: [
      "To provide plant identification, health diagnosis, care plans, reminders, and local growing advice.",
      "To send notifications you have enabled (care reminders, weather alerts, learning streaks). You can pause or disable these at any time in Settings → Notifications.",
      "To improve PlantPal. Aggregate usage data helps us find confusing flows and fix bugs.",
      "To respond when you contact support or send feedback.",
    ],
  },
  {
    title: "3. What we never do",
    body: [
      "We do not sell your personal information.",
      "We do not share your photos or garden data with advertisers.",
      "We do not send marketing email unless you opt in, and every message includes an unsubscribe option.",
    ],
  },
  {
    title: "4. Service providers",
    body: [
      "PlantPal uses trusted processors to run the service: Supabase (account, database, and photo hosting), OpenAI (photo analysis for identification and diagnosis), Pl@ntNet (species identification), OpenWeather (local weather), Resend (transactional email), and Sentry (crash reporting). Each receives only the data needed to perform its function.",
    ],
  },
  {
    title: "5. Data retention and deletion",
    body: [
      "Your data is retained while your account is active. You can request deletion of your account and all associated data at any time from our Support page. Requests are completed within 30 days.",
    ],
  },
  {
    title: "6. Children",
    body: [
      "PlantPal is not directed at children under 13, and we do not knowingly collect personal information from them.",
    ],
  },
  {
    title: "7. Changes to this policy",
    body: [
      "If we make material changes, we will notify you in the app before they take effect. Continued use after changes means you accept the updated policy.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mt-2">Effective June 1, 2026</p>
      <p className="text-gray-600 mt-6 leading-relaxed">
        PlantPal helps you care for your plants. To do that well, we collect a small
        amount of information, and we treat it carefully. This policy explains what we
        collect, why, and the choices you have.
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
        <h2 className="text-lg font-semibold text-gray-900">8. Contact us</h2>
        <p className="text-gray-600 mt-3 leading-relaxed">
          Questions about privacy or your data? Visit our{" "}
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

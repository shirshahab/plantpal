import type { Metadata } from "next";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

export const metadata: Metadata = {
  title: "Join Waitlist",
  description: "Join the PlantPal waitlist for early access to the smart plant care coach.",
};

export default function WaitlistPage() {
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center mb-10">
        <p className="text-sm font-medium text-green-600 uppercase tracking-wide mb-3">
          Early access
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          Join the PlantPal waitlist
        </h1>
        <p className="text-gray-500 mt-4 leading-relaxed">
          Be first to know when we launch. Tell us what you grow so we can tailor your experience.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <WaitlistForm variant="full" source="waitlist-page" />
      </div>
    </div>
  );
}

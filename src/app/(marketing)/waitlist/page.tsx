import type { Metadata } from "next";
import { WaitlistPageClient } from "./waitlist-client";
import { absoluteUrl } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Join Waitlist",
  description: "Join the PlantPal beta and save a few plants along the way.",
  alternates: { canonical: absoluteUrl("/waitlist") },
  openGraph: {
    title: "Join the PlantPal Waitlist",
    description: "Join the PlantPal beta and save a few plants along the way.",
    url: absoluteUrl("/waitlist"),
  },
};

export default function WaitlistPage() {
  return <WaitlistPageClient />;
}

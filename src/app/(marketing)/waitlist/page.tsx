import type { Metadata } from "next";
import { WaitlistPageClient } from "./waitlist-client";

export const metadata: Metadata = {
  title: "Join Waitlist",
  description: "Join the PlantPal waitlist for early access to the smart plant care coach.",
};

export default function WaitlistPage() {
  return <WaitlistPageClient />;
}

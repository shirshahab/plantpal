import { redirect } from "next/navigation";

/** Legacy beta onboarding route — redirect to standard onboarding. */
export default function BetaStartPage() {
  redirect("/onboarding");
}

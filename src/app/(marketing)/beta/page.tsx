import { redirect } from "next/navigation";

/** Legacy beta marketing route — redirect to public pricing. */
export default function BetaPage() {
  redirect("/pricing");
}

import { redirect } from "next/navigation";

export default function SignupRedirect() {
  redirect("/login?signup=1");
}

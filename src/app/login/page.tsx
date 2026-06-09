import { Suspense } from "react";
import LoginPageClient from "./login-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>}>
      <LoginPageClient />
    </Suspense>
  );
}

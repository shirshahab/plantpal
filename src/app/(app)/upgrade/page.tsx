import { Suspense } from "react";
import UpgradePageClient from "./upgrade-client";

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
      <UpgradePageClient />
    </Suspense>
  );
}

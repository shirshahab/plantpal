"use client";

import type { SubscriptionFeature } from "@/lib/subscription/types";
import { getUpgradeCopy } from "@/lib/subscription/types";
import { useSubscription } from "@/lib/store/subscription-provider";
import { FeatureLockLabel } from "@/components/billing/feature-lock-label";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";

interface FeatureGateProps {
  feature: SubscriptionFeature | string;
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
  /** Show feature title with lock badge above the upgrade prompt */
  showLockHeader?: boolean;
}

export function FeatureGate({
  feature,
  children,
  compact,
  className,
  showLockHeader = true,
}: FeatureGateProps) {
  const { canUse, betaUnlockAll } = useSubscription();

  if (canUse(feature)) {
    return <>{children}</>;
  }

  if (betaUnlockAll) {
    return <>{children}</>;
  }

  const copy = getUpgradeCopy(feature);

  if (compact) {
    return (
      <div className={className}>
        {showLockHeader && (
          <div className="mb-2">
            <FeatureLockLabel feature={feature} />
          </div>
        )}
      <UpgradePrompt title={copy.title} message={copy.message} lockLabel={copy.lockLabel} compact />
      </div>
    );
  }

  return (
    <div className={className}>
      {showLockHeader && (
        <div className="mb-3 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{copy.title}</h3>
          <FeatureLockLabel feature={feature} />
        </div>
      )}
      <UpgradePrompt title={copy.title} message={copy.message} lockLabel={copy.lockLabel} />
    </div>
  );
}

"use client";

import { InviteFriendsPanel } from "@/components/referrals/invite-friends-panel";
import { PageHeader } from "@/components/page-header";

export default function InvitePage() {
  return (
    <div className="max-w-lg mx-auto space-y-6 pb-4">
      <PageHeader
        title="Invite friends"
        description="Share PlantPal and get Plus trials together."
      />
      <InviteFriendsPanel />
    </div>
  );
}

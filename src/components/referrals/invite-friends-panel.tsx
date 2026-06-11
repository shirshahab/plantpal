"use client";

import { useEffect, useState } from "react";
import { Copy, Gift, Share2, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getOrCreateReferralCode,
  getReferralLink,
  getReferralStats,
} from "@/lib/referrals/index";
import { useToast } from "@/lib/store/toast-provider";

export function InviteFriendsPanel({ compact = false }: { compact?: boolean }) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [invites, setInvites] = useState(0);

  useEffect(() => {
    const c = getOrCreateReferralCode();
    setCode(c);
    setLink(getReferralLink(c));
    setInvites(getReferralStats(c).invites);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast("Invite link copied!");
    } catch {
      toast("Could not copy. Select the link manually.");
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on PlantPal",
          text: "Track plants, get daily care tasks, and scan for IDs. We both get 7 days of PlantPal Plus!",
          url: link,
        });
        return;
      } catch {
        /* user cancelled */
      }
    }
    void copyLink();
  }

  return (
    <Card padding="md" className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Invite a friend</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Share PlantPal. You both get <strong>7 days of PlantPal Plus</strong> when they join.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
        <Users className="w-4 h-4 text-green-600 shrink-0" />
        <span className="text-sm text-gray-600">
          {invites} friend{invites !== 1 ? "s" : ""} joined via your link
        </span>
      </div>

      <Input label="Your referral code" value={code} readOnly />
      <Input label="Invite link" value={link} readOnly />

      <div className="flex flex-col sm:flex-row gap-2">
        <Button className="flex-1 touch-manipulation" onClick={shareLink}>
          <Share2 className="w-4 h-4" />
          Share invite
        </Button>
        <Button variant="outline" className="flex-1 touch-manipulation" onClick={copyLink}>
          <Copy className="w-4 h-4" />
          Copy link
        </Button>
      </div>
    </Card>
  );
}

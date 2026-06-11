"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function InviteFriendsCard() {
  return (
    <Card padding="md" className="bg-green-50/70 border-green-100">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <UserPlus className="w-5 h-5 text-green-700" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            Plants are more fun when other people are also trying not to kill them.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Invite a friend and keep each other&apos;s gardens alive.
          </p>
          <Link href="/invite" className="inline-block mt-2.5">
            <Button size="sm" className="touch-manipulation">
              Invite a friend
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

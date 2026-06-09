"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { VISIBILITY_OPTIONS } from "@/lib/social/constants";
import type { FeedVisibility } from "@/lib/social/types";
import { publishActivityEvent } from "@/lib/social/events";
import { useAuth } from "@/lib/store/auth-provider";
import { useToast } from "@/lib/store/toast-provider";

interface SharePhotoDialogProps {
  open: boolean;
  onClose: () => void;
  plantId: string;
  plantName: string;
  photoUrl: string;
  caption?: string;
}

export function SharePhotoDialog({
  open,
  onClose,
  plantId,
  plantName,
  photoUrl,
  caption,
}: SharePhotoDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visibility, setVisibility] = useState<FeedVisibility>("friends");
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);
    const actorName =
      user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "You";

    await publishActivityEvent({
      userId: user?.id ?? "local-user",
      eventType: "growth_photo",
      title: `uploaded a growth photo of ${plantName}`,
      body: caption ?? "",
      visibility,
      payload: { plantId, photoUrl },
      actorName,
    });

    if (visibility !== "private") {
      await fetch("/api/social/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantId,
          entryType: "photo",
          body: caption ?? `Growth photo — ${plantName}`,
          photoUrl,
          visibility,
        }),
      });
    }

    setSharing(false);
    toast(visibility === "private" ? "Photo saved privately." : "Photo shared with your circle!");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Share growth photo">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Celebrate progress with friends and family — always positive, always optional.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setVisibility(opt.id)}
              className={`rounded-xl border px-3 py-3 text-left text-xs touch-manipulation ${
                visibility === opt.id
                  ? "border-green-500 bg-green-50 ring-2 ring-green-500/20"
                  : "border-gray-100 hover:border-green-200"
              }`}
            >
              <span className="font-semibold text-gray-900 block">{opt.label}</span>
              <span className="text-gray-400">{opt.description}</span>
            </button>
          ))}
        </div>
        <Button className="w-full touch-manipulation" loading={sharing} onClick={() => void handleShare()}>
          <Share2 className="w-4 h-4" />
          {visibility === "private" ? "Save privately" : "Share to feed"}
        </Button>
      </div>
    </Modal>
  );
}

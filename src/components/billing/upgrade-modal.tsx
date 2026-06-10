"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  headline?: string;
  copy?: string;
  className?: string;
}

export function UpgradeModal({
  open,
  onClose,
  headline = "Unlock PlantPal Plus",
  copy = "Get unlimited plants, personalized care plans, photo diagnosis, climate intelligence, and more.",
  className,
}: UpgradeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={headline}
      description={copy}
      footer={
        <div className={cn("flex w-full flex-col-reverse sm:flex-row gap-2 sm:justify-end", className)}>
          <Button variant="ghost" onClick={onClose} className="touch-manipulation">
            Maybe Later
          </Button>
          <Link href="/upgrade" onClick={onClose} className="w-full sm:w-auto">
            <Button className="w-full touch-manipulation">Upgrade</Button>
          </Link>
        </div>
      }
    >
      <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-amber-700" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Billing is not active yet — choosing a plan in preview mode unlocks features for testing.
        </p>
      </div>
    </Modal>
  );
}

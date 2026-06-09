"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface RemovePlantModalProps {
  open: boolean;
  plantName: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RemovePlantModal({
  open,
  plantName,
  loading,
  onClose,
  onConfirm,
}: RemovePlantModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Remove this plant from your garden?"
      description="This will remove the plant, tasks, photos, care logs, and local history from PlantPal."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            Remove Plant
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">
        You are removing <span className="font-semibold text-gray-900">{plantName}</span>.
        This cannot be undone.
      </p>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { RemovePlantModal } from "@/components/plants/remove-plant-modal";
import { usePlants } from "@/lib/store/plants-provider";
import { useToast } from "@/lib/store/toast-provider";

export function PlantActionsMenu({
  plantId,
  plantName,
  variant = "detail",
}: {
  plantId: string;
  plantName: string;
  variant?: "detail" | "card";
}) {
  const router = useRouter();
  const { removePlant } = usePlants();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    try {
      await removePlant(plantId);
      toast("Plant removed.");
      router.push("/plants");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove plant.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          aria-label="Plant actions"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className={
            variant === "card"
              ? "absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-600 hover:text-gray-900"
              : "w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
          }
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-30 min-w-[160px] rounded-xl border border-gray-100 bg-white shadow-lg py-1 overflow-hidden">
              <Link
                href={`/plants/${plantId}/edit`}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50"
                onClick={() => setMenuOpen(false)}
              >
                <Pencil className="w-4 h-4" />
                Edit Plant
              </Link>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  setMenuOpen(false);
                  setOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
                Remove Plant
              </button>
            </div>
          </>
        )}
      </div>

      <RemovePlantModal
        open={open}
        plantName={plantName}
        loading={loading}
        onClose={() => setOpen(false)}
        onConfirm={() => void handleRemove()}
      />
    </>
  );
}

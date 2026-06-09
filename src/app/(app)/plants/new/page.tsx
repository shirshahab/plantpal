"use client";

import { Suspense } from "react";
import { AddPlantWizard } from "@/components/mobile/add-plant-wizard";
import { SendFeedbackButton } from "@/components/feedback/send-feedback-button";

export default function NewPlantPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
      <div className="max-w-lg mx-auto">
        <div className="flex justify-end mb-3">
          <SendFeedbackButton />
        </div>
        <AddPlantWizard />
      </div>
    </Suspense>
  );
}

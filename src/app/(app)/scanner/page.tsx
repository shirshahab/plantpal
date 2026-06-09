"use client";

import { CameraHub } from "@/components/scanner/camera-hub";
import { SendFeedbackButton } from "@/components/feedback/send-feedback-button";

export default function ScannerPage() {
  return (
    <div className="max-w-lg mx-auto px-1 pt-2">
      <div className="flex justify-end mb-3 px-1">
        <SendFeedbackButton defaultCategory="wrong_plant_result" />
      </div>
      <CameraHub />
    </div>
  );
}

import { Suspense } from "react";
import { ProDoctorClient } from "@/components/health/pro-doctor-client";

export const metadata = {
  title: "Advanced Plant Doctor | PlantPal",
};

export default function ProDoctorPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-2xl" />}>
      <ProDoctorClient />
    </Suspense>
  );
}

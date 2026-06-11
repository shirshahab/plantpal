import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlantyAvatar } from "@/components/brand/planty";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <PlantyAvatar variant="uhOh" size={80} className="mx-auto" />
        <h1 className="text-xl font-semibold text-gray-900 mt-5">
          This page is dead. Unlike your plants, hopefully.
        </h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          The page you&apos;re looking for moved, got pruned, or never existed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link href="/dashboard">
            <Button className="w-full sm:w-auto">Go to my garden</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Back to homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

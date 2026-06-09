import Link from "next/link";
import { Leaf, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <WifiOff className="w-8 h-8 text-gray-400" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="w-5 h-5 text-green-600" />
        <span className="font-semibold text-gray-900">PlantPal</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900">You&apos;re offline</h1>
      <p className="text-gray-500 mt-2 max-w-sm text-sm leading-relaxed">
        Check your connection and try again. Your locally saved plants and tasks
        are still available when you reopen the app.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors"
      >
        Try again
      </Link>
    </div>
  );
}

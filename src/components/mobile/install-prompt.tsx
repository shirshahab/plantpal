"use client";

import { Download, X, Share, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/lib/hooks/use-pwa-install";
import { useState, useEffect } from "react";

const DISMISS_KEY = "plantpal-install-dismissed";

export function InstallPrompt() {
  const { canInstall, isInstalled, isIOS, isAndroid, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (isInstalled || dismissed || !canInstall) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <Card
      padding="md"
      className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0 shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">Install PlantPal</h3>
          <p className="text-sm text-green-50 mt-1 leading-relaxed">
            Add to your home screen for quick access to daily care tasks and reminders.
          </p>

          {isIOS && (
            <div className="mt-3 p-3 rounded-xl bg-white/10 text-xs text-green-50 space-y-1.5">
              <p className="font-medium flex items-center gap-1.5">
                <Share className="w-3.5 h-3.5" />
                iPhone / iPad
              </p>
              <ol className="list-decimal list-inside space-y-0.5 opacity-90">
                <li>Tap the Share button in Safari</li>
                <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                <li>Tap Add. PlantPal opens like a native app</li>
              </ol>
            </div>
          )}

          {isAndroid && !isIOS && (
            <Button
              size="sm"
              className="mt-3 bg-white text-green-700 hover:bg-green-50"
              onClick={() => install()}
            >
              <Smartphone className="w-4 h-4" />
              Install App
            </Button>
          )}

          {!isIOS && !isAndroid && (
            <Button
              size="sm"
              className="mt-3 bg-white text-green-700 hover:bg-green-50"
              onClick={() => install()}
            >
              Install App
            </Button>
          )}
        </div>
        <button
          onClick={dismiss}
          className="p-1 rounded-lg hover:bg-white/10 text-green-100"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}

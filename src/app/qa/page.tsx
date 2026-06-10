"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Leaf, CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const QA_ITEMS = [
  { id: "auth", label: "Auth", desc: "Sign up, sign in, sign out work in Supabase mode" },
  { id: "add-plant", label: "Add plant", desc: "Wizard completes and plant appears in garden" },
  { id: "supabase-save", label: "Supabase save", desc: "Plants and tasks sync to cloud when logged in" },
  { id: "ai-care", label: "AI care plan", desc: "Generate care plan on plant detail page" },
  { id: "scanner", label: "Scanner", desc: "Identify, diagnose, tag, and progress tabs work" },
  { id: "scanner-photo", label: "Scanner accuracy", desc: "Identify a real plant photo — species + confidence look reasonable" },
  { id: "scanner-fail", label: "Scanner failure path", desc: "Blurry/non-plant photo shows a graceful retry message, not a crash" },
  { id: "doctor-pro", label: "Plant Doctor Pro", desc: "Pro diagnosis returns report with remedy plan and follow-up tasks" },
  { id: "notifications", label: "Notifications", desc: "Bell shows alerts; daily push digest fires when enabled" },
  { id: "feedback", label: "Feedback", desc: "Floating feedback button submits; bug report includes diagnostics" },
  { id: "tasks", label: "Tasks", desc: "Today page shows tasks; complete/skip/snooze work" },
  { id: "weather", label: "Weather", desc: "Local care card shows weather (live or mock)" },
  { id: "database", label: "Database search", desc: "Plant database search returns results" },
  { id: "price-checker", label: "Price checker", desc: "Price check returns fair range verdict" },
  { id: "mobile-nav", label: "Mobile navigation", desc: "Bottom nav, add button, and More menu work" },
  { id: "pwa", label: "PWA install", desc: "Install prompt appears; app opens standalone" },
  { id: "setup", label: "Setup checker", desc: "Supabase URL, tables, storage, API keys" },
  { id: "empty-state", label: "Empty state", desc: "New account shows 'Let's add your first plant.'" },
];

const STORAGE_KEY = "plantpal-qa-checklist";

export default function QAPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function reset() {
    setChecked({});
    localStorage.removeItem(STORAGE_KEY);
  }

  const passed = QA_ITEMS.filter((i) => checked[i.id]).length;
  const allPass = passed === QA_ITEMS.length;

  return (
    <div className="min-h-screen bg-[#f8faf8]">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">QA Checklist</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manual QA</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Tap each item after verifying. Progress saves locally.
          </p>
          <div
            className={cn(
              "mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              allPass ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
            )}
          >
            {passed} / {QA_ITEMS.length} passed
          </div>
        </div>

        <div className="space-y-2">
          {QA_ITEMS.map((item) => {
            const isChecked = !!checked[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className="w-full text-left"
              >
                <Card
                  padding="md"
                  className={cn(
                    "transition-colors",
                    isChecked ? "border-green-200 bg-green-50/50" : "hover:border-gray-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>

        <Card padding="md" className="border-blue-100 bg-blue-50/40">
          <p className="text-sm font-semibold text-gray-900">Scanner not identifying?</p>
          <p className="text-xs text-gray-500 mt-1">
            The scanner diagnostics page traces every step — API keys, payload size, AI
            response, and the exact failure point.
          </p>
          <Link href="/debug/scanner" className="inline-block mt-3">
            <Button variant="secondary" size="sm">
              Open scanner diagnostics
            </Button>
          </Link>
        </Card>

        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full">
              Open App
            </Button>
          </Link>
          <Link href="/setup" className="flex-1">
            <Button variant="outline" className="w-full">
              Setup Checker
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

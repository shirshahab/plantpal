"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface QueuedToast {
  id: string;
  lines: string[];
  durationMs?: number;
}

const DISPLAY_MS = 2800;
const FADE_MS = 350;

let enqueueExternal: ((toast: Omit<QueuedToast, "id">) => void) | null = null;

/** Enqueue a toast from anywhere (tasks, XP events). Only one shows at a time. */
export function queueToast(input: Omit<QueuedToast, "id"> | string): void {
  const payload: Omit<QueuedToast, "id"> =
    typeof input === "string" ? { lines: [input] } : input;
  enqueueExternal?.(payload);
}

/** Batch XP + task messages into one toast when fired together. */
export function queueCompletionBurst(xpAmount: number, taskTitles: string[]): void {
  const lines: string[] = [];
  if (xpAmount > 0) {
    lines.push(`+${xpAmount} XP earned`);
  }
  if (taskTitles.length === 1) {
    lines.push(`Task completed:\n${taskTitles[0]}`);
  } else if (taskTitles.length > 1) {
    lines.push(`${taskTitles.length} tasks completed`);
  }
  if (lines.length === 0) return;
  queueToast({ lines, durationMs: DISPLAY_MS });
}

export function XpToastQueueHost() {
  const [current, setCurrent] = useState<QueuedToast | null>(null);
  const [visible, setVisible] = useState(false);
  const queueRef = useRef<QueuedToast[]>([]);
  const showingRef = useRef(false);

  useEffect(() => {
    function showNext() {
      if (showingRef.current) return;
      const next = queueRef.current.shift();
      if (!next) {
        setCurrent(null);
        setVisible(false);
        return;
      }
      showingRef.current = true;
      setCurrent(next);
      requestAnimationFrame(() => setVisible(true));
      const duration = next.durationMs ?? DISPLAY_MS;
      setTimeout(() => setVisible(false), duration);
      setTimeout(() => {
        showingRef.current = false;
        showNext();
      }, duration + FADE_MS);
    }

    enqueueExternal = (input) => {
      queueRef.current.push({ ...input, id: crypto.randomUUID() });
      showNext();
    };

    return () => {
      enqueueExternal = null;
    };
  }, []);

  if (!current) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[min(100%,20rem)] px-4 pointer-events-none transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0"
      )}
      aria-live="polite"
    >
      <div className="toast-enter bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-lg text-center whitespace-pre-line">
        {current.lines.join("\n")}
      </div>
    </div>
  );
}

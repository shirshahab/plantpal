"use client";

import { useEffect, useState } from "react";
import { BookOpen, Camera, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VISIBILITY_OPTIONS } from "@/lib/social/constants";
import type { FeedVisibility, PlantJournalEntry } from "@/lib/social/types";
import { defaultFeedVisibility, relativeSocialTime } from "@/lib/social/events";
import { useToast } from "@/lib/store/toast-provider";

const MILESTONES = [
  "First flower appeared",
  "Repotted today",
  "First harvest",
  "New growth spotted",
  "Recovered from stress",
];

interface PlantJournalTabProps {
  plantId: string;
  plantName: string;
}

export function PlantJournalTab({ plantId, plantName }: PlantJournalTabProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<PlantJournalEntry[]>([]);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<FeedVisibility>(defaultFeedVisibility);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch(`/api/social/journal?plantId=${encodeURIComponent(plantId)}`)
      .then((r) => r.json())
      .then((json: { ok: boolean; entries?: PlantJournalEntry[] }) => {
        if (json.ok) setEntries(json.entries ?? []);
      });
  }, [plantId]);

  async function addEntry(entryType: PlantJournalEntry["entryType"], body: string, milestoneType?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/social/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId, entryType, body, milestoneType, visibility }),
      });
      const json = (await res.json()) as { ok: boolean; id?: string };
      if (json.ok) {
        setEntries((prev) => [
          {
            id: json.id ?? crypto.randomUUID(),
            plantId,
            userId: "",
            entryType,
            body,
            photoUrl: null,
            milestoneType: milestoneType ?? null,
            visibility,
            feedEventId: null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setNote("");
        toast(entryType === "milestone" ? "Milestone shared!" : "Journal entry saved.");
      } else {
        toast("Couldn't save that entry. Please try again.");
      }
    } catch {
      toast("Couldn't save that entry. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">{plantName} Journal</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Photos, notes, and milestones, shared with your circle when you choose.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Add a note"
            placeholder={`What's happening with ${plantName}?`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Share with</p>
            <div className="grid grid-cols-2 gap-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVisibility(opt.id)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs touch-manipulation ${
                    visibility === opt.id
                      ? "border-green-500 bg-green-50 text-green-800"
                      : "border-gray-100 text-gray-600"
                  }`}
                >
                  <span className="font-semibold block">{opt.label}</span>
                  <span className="text-gray-400">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>
          <Button
            className="w-full touch-manipulation"
            loading={loading}
            disabled={!note.trim()}
            onClick={() => void addEntry("note", note.trim())}
          >
            Save journal entry
          </Button>
        </CardContent>
      </Card>

      <Card padding="md">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Quick milestones</p>
        <div className="flex flex-wrap gap-2">
          {MILESTONES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => void addEntry("milestone", m, m)}
              className="rounded-full bg-green-50 text-green-800 text-xs font-medium px-3 py-1.5 hover:bg-green-100 touch-manipulation"
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              {m}
            </button>
          ))}
        </div>
      </Card>

      <Card padding="md">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Timeline</p>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No journal entries yet. Document {plantName}&apos;s journey!
          </p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  {entry.entryType === "photo" ? (
                    <Camera className="w-4 h-4 text-green-600" />
                  ) : entry.entryType === "milestone" ? (
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0 border-l-2 border-green-100 pl-3">
                  <p className="text-sm text-gray-900">{entry.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {relativeSocialTime(entry.createdAt)} · {entry.visibility}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

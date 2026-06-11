"use client";

import { useState } from "react";
import { Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CHALLENGE_TEMPLATES } from "@/lib/social/constants";
import { joinChallenge, useActiveChallenges } from "@/lib/social/hooks";
import { useToast } from "@/lib/store/toast-provider";

/**
 * Browse and join community challenges. Solo by default, or run the
 * same challenge with friends.
 */
export function ChallengesPanel() {
  const { challenges, refresh } = useActiveChallenges();
  const { toast } = useToast();
  const [joining, setJoining] = useState<number | null>(null);

  const activeTitles = new Set(challenges.map((c) => c.title));

  async function handleJoin(index: number, scope: "personal" | "family") {
    setJoining(index);
    try {
      const ok = await joinChallenge(index, scope);
      if (ok) {
        toast(
          scope === "family"
            ? "Challenge on. Tell your people."
            : "Challenge accepted. Your plants are watching."
        );
        await refresh();
      } else {
        toast("Sign in to join challenges.");
      }
    } catch {
      toast("Could not join right now. Try again.");
    } finally {
      setJoining(null);
    }
  }

  return (
    <div className="space-y-3">
      {CHALLENGE_TEMPLATES.map((tpl, index) => {
        const joined = activeTitles.has(tpl.title);
        return (
          <Card key={tpl.title} padding="md">
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden>
                {tpl.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-900">{tpl.title}</h3>
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                    +{tpl.rewardXp} XP
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tpl.description}. Goal: {tpl.target} {tpl.unit}.
                </p>
                {joined ? (
                  <p className="text-xs font-medium text-green-700 mt-2 inline-flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    You&apos;re in. Go do the thing.
                  </p>
                ) : (
                  <div className="flex gap-2 mt-2.5">
                    <Button
                      size="sm"
                      loading={joining === index}
                      className="touch-manipulation"
                      onClick={() => void handleJoin(index, "personal")}
                    >
                      Join solo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={joining === index}
                      className="touch-manipulation"
                      onClick={() => void handleJoin(index, "family")}
                    >
                      <Users className="w-3.5 h-3.5" />
                      With friends
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

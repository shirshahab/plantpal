"use client";

import { useState } from "react";
import { Copy, Trophy, Users, Home } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoatProgressBar, MoatProgressRing } from "@/components/moat/moat-progress";
import { useMoat } from "@/lib/store/moat-provider";
import { useToast } from "@/lib/store/toast-provider";

const ROLE_LABELS = {
  parent: "Parent",
  child: "Child",
  roommate: "Roommate",
};

export function FamilyDashboard() {
  const { household } = useMoat();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const sorted = [...household.members].sort((a, b) => b.totalXp - a.totalXp);
  const challenge = household.activeChallenge;

  function copyInvite() {
    void navigator.clipboard.writeText(household.inviteCode);
    toast("Invite code copied!");
  }

  async function createFamilyGarden() {
    const res = await fetch("/api/social/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name: household.name, groupType: "family" }),
    });
    const json = (await res.json()) as { ok: boolean; inviteCode?: string };
    if (json.ok && json.inviteCode) {
      toast(`Family garden created! Code: ${json.inviteCode}`);
    } else {
      toast("Family garden ready (local mode).");
    }
  }

  async function joinFamilyGarden() {
    if (!inviteCode.trim()) return;
    setJoining(true);
    const res = await fetch("/api/social/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", inviteCode: inviteCode.trim() }),
    });
    const json = (await res.json()) as { ok: boolean };
    setJoining(false);
    toast(json.ok ? "Joined family garden!" : "Invalid invite code.");
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto page-enter">
      <PageHeader
        title="PlantPal Family"
        description="Grow together — shared XP, streaks, and challenges"
        action={
          <div className="flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-1.5">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-700">{household.members.length}</span>
          </div>
        }
      />

      <Card padding="md" className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-0">
        <p className="text-xs font-semibold text-green-100 uppercase tracking-wide">Family XP</p>
        <p className="text-4xl font-bold mt-1">{household.totalFamilyXp.toLocaleString()}</p>
        <p className="text-sm text-green-100 mt-2">{household.name}</p>
        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-white/15 px-3 py-2 text-sm font-mono">
            {household.inviteCode}
          </code>
          <Button variant="secondary" size="sm" onClick={copyInvite}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-green-200 mt-2">
          Invite spouse, children, or roommates with this code
        </p>
      </Card>

      <Card padding="md" className="border-green-100">
        <div className="flex items-start gap-3">
          <Home className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Shared family garden</p>
            <p className="text-xs text-gray-500 mt-1">
              Owner · Editor · Viewer roles. Shared plants, tasks, milestones & feed.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" onClick={() => void createFamilyGarden()}>
                Create family garden
              </Button>
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <Button size="sm" loading={joining} onClick={() => void joinFamilyGarden()}>
                Join
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {challenge && (
        <Card padding="md" className="border-amber-100 bg-amber-50/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-600 uppercase">Family Challenge</p>
              <p className="font-bold text-gray-900 mt-0.5">{challenge.title}</p>
              <p className="text-xs text-gray-500">{challenge.description}</p>
              <div className="mt-3">
                <MoatProgressBar value={challenge.progress} max={challenge.target} color="amber" />
                <p className="text-xs text-gray-500 mt-1">
                  {challenge.progress}/{challenge.target} {challenge.unit}
                </p>
              </div>
              <p className="text-xs text-green-600 font-semibold mt-2">
                Reward: +{challenge.rewardXp} XP · {challenge.rewardBadge} badge
              </p>
            </div>
          </div>
        </Card>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Family leaderboard · XP · Streaks · Plants · Lessons · Harvests
        </p>
        <div className="space-y-2">
          {sorted.map((member, i) => (
            <Card key={member.id} padding="md" className={i === 0 ? "border-green-200 bg-green-50/40" : ""}>
              <div className="flex items-center gap-3">
                <span className="text-2xl w-8 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <span className="text-2xl">{member.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{member.name}</p>
                    <span className="text-[10px] text-gray-400">{ROLE_LABELS[member.role]}</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">{member.totalXp.toLocaleString()} XP</p>
                </div>
                <MoatProgressRing
                  value={member.wateringStreak}
                  max={30}
                  size={52}
                  label=""
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50 text-center text-xs">
                <div>
                  <p className="font-bold text-gray-900">{member.plantsMaintained}</p>
                  <p className="text-gray-400">Plants</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{member.wateringStreak}d</p>
                  <p className="text-gray-400">Streak</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{member.badgesEarned}</p>
                  <p className="text-gray-400">Badges</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

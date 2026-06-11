"use client";

import { useMemo, useState } from "react";
import { Copy, Heart, Home, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoatProgressRing } from "@/components/moat/moat-progress";
import { useMoat } from "@/lib/store/moat-provider";
import { useAcademy } from "@/lib/store/academy-provider";
import { usePlants } from "@/lib/store/plants-provider";
import { useToast } from "@/lib/store/toast-provider";
import type { FamilyMember } from "@/lib/moat/family-data";

const ROLE_LABELS: Record<FamilyMember["role"], string> = {
  parent: "Parent",
  child: "Child",
  roommate: "Roommate",
};

function HouseholdSetup() {
  const { createFamilyHousehold } = useMoat();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  function create() {
    const household = createFamilyHousehold(name, memberName);
    toast(`${household.name} created! Share code ${household.inviteCode}`);
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
        description="Grow together: shared XP, streaks, and challenges"
      />

      <Card padding="md" className="border-pink-100 bg-gradient-to-br from-pink-50/40 to-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-pink-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="font-semibold text-gray-900">Create your household</p>
              <p className="text-sm text-gray-500 mt-1">
                Start a household, then share your invite code with family or roommates.
              </p>
            </div>
            <Input
              placeholder="Household name (e.g. The Garcia Garden)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Your name"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />
            <Button onClick={create} disabled={!name.trim()}>
              Create household
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="md" className="border-green-100">
        <div className="flex items-start gap-3">
          <Home className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Have an invite code?</p>
            <p className="text-xs text-gray-500 mt-1">
              Join a family garden someone else created.
            </p>
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
    </div>
  );
}

export function FamilyDashboard() {
  const { household } = useMoat();
  const { progress } = useAcademy();
  const { plants } = usePlants();
  const { toast } = useToast();

  // The local member ("you") always reflects live app stats.
  const members = useMemo<FamilyMember[]>(() => {
    if (!household) return [];
    return household.members
      .map((m) =>
        m.id === "you"
          ? {
              ...m,
              totalXp: progress.totalXp,
              plantsMaintained: plants.length,
              wateringStreak: progress.currentStreak,
              badgesEarned: progress.unlockedBadges.length,
            }
          : m
      )
      .sort((a, b) => b.totalXp - a.totalXp);
  }, [household, progress, plants.length]);

  if (!household) return <HouseholdSetup />;

  const totalFamilyXp = members.reduce((sum, m) => sum + m.totalXp, 0);

  function copyInvite() {
    if (!household) return;
    void navigator.clipboard.writeText(household.inviteCode);
    toast("Invite code copied!");
  }

  async function createFamilyGarden() {
    if (!household) return;
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

  return (
    <div className="space-y-6 max-w-lg mx-auto page-enter">
      <PageHeader
        title="PlantPal Family"
        description="Grow together: shared XP, streaks, and challenges"
        action={
          <div className="flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-1.5">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-700">{members.length}</span>
          </div>
        }
      />

      <Card padding="md" className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-0">
        <p className="text-xs font-semibold text-green-100 uppercase tracking-wide">Family XP</p>
        <p className="text-4xl font-bold mt-1">{totalFamilyXp.toLocaleString()}</p>
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
          </div>
        </div>
      </Card>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Family leaderboard · XP · Streaks · Plants
        </p>
        <div className="space-y-2">
          {members.map((member, i) => (
            <Card key={member.id} padding="md" className={i === 0 ? "border-green-200 bg-green-50/40" : ""}>
              <div className="flex items-center gap-3">
                <span className="text-2xl w-8 text-center">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </span>
                <span className="text-2xl">{member.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{member.name}</p>
                    <span className="text-[10px] text-gray-400">{ROLE_LABELS[member.role]}</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {member.totalXp.toLocaleString()} XP
                  </p>
                </div>
                <MoatProgressRing value={member.wateringStreak} max={30} size={52} label="" />
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
        {members.length === 1 && (
          <Card padding="md" className="mt-3 border-dashed border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-600 text-center">
              Waiting for family to join. Share your invite code{" "}
              <span className="font-mono font-semibold">{household.inviteCode}</span>
            </p>
          </Card>
        )}
      </div>

      <Card padding="md" className="border-amber-100 bg-amber-50/30">
        <p className="text-sm font-semibold text-gray-900">Family challenges</p>
        <p className="text-xs text-gray-500 mt-1">
          Weekly team challenges start once a second member joins your household.
        </p>
      </Card>
    </div>
  );
}

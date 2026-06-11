"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, UserPlus, UserCheck, UserX, Ban } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useFriends,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "@/lib/social/hooks";
import type { SocialProfile } from "@/lib/social/types";
import { useToast } from "@/lib/store/toast-provider";

type Tab = "friends" | "requests" | "search";

export function FriendsHub() {
  const { toast } = useToast();
  const { friends, incoming, outgoing, loading, refresh } = useFriends();
  const [tab, setTab] = useState<Tab>("friends");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SocialProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearch() {
    if (query.trim().length < 2) return;
    setSearching(true);
    const { users, error } = await searchUsers(query.trim());
    setResults(users);
    setSearchError(error);
    setSearched(true);
    setSearching(false);
    setTab("search");
  }

  async function handleSend(userId: string) {
    const { ok, error } = await sendFriendRequest(userId);
    toast(ok ? "Friend request sent!" : (error ?? "Could not send request."));
    if (ok) void refresh();
  }

  async function handleAccept(requestId: string) {
    const ok = await acceptFriendRequest(requestId);
    toast(ok ? "You're now friends!" : "Could not accept.");
    if (ok) void refresh();
  }

  async function handleDecline(requestId: string) {
    await declineFriendRequest(requestId);
    void refresh();
  }

  async function handleRemove(userId: string) {
    const ok = await removeFriend(userId);
    toast(ok ? "Friend removed." : "Could not remove.");
    if (ok) void refresh();
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-4">
      <PageHeader
        title="PlantPal Circles"
        description="Connect with family, friends, and neighbors. Celebrate garden wins together."
      />

      <Card padding="md" className="bg-green-50/50 border-green-100">
        <p className="text-sm text-gray-700">
          Positive gardening community only: no downvotes, no drama. Encourage each other. 🌱
        </p>
      </Card>

      <div className="flex gap-2">
        <Input
          placeholder="Search by name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
        />
        <Button
          loading={searching}
          onClick={() => void handleSearch()}
          className="shrink-0 touch-manipulation"
          aria-label="Search for friends"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {(
          [
            ["friends", `Friends (${friends.length})`],
            ["requests", `Requests (${incoming.length})`],
            ["search", "Search"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors touch-manipulation ${
              tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card padding="md" className="text-center text-sm text-gray-500">Loading…</Card>
      ) : tab === "friends" ? (
        friends.length === 0 ? (
          <Card padding="md" className="text-center space-y-3">
            <UserPlus className="w-8 h-8 text-gray-300 mx-auto" />
            <div>
              <p className="font-medium text-gray-900">No friends yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Gardening is better together. Find friends or invite someone.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => setTab("search")} className="touch-manipulation">
                Find gardeners
              </Button>
              <Link href="/invite">
                <Button size="sm" className="touch-manipulation">Invite a friend</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <Card key={f.id} padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">
                    {(f.profile.fullName ?? "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {f.profile.fullName ?? f.profile.email ?? "Friend"}
                    </p>
                    <p className="text-xs text-gray-400">Connected {new Date(f.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-600 touch-manipulation"
                    onClick={() => void handleRemove(f.friendId)}
                    aria-label="Remove friend"
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : tab === "requests" ? (
        <div className="space-y-4">
          {incoming.length === 0 && outgoing.length === 0 ? (
            <Card padding="md" className="text-center text-sm text-gray-500">No pending requests</Card>
          ) : null}
          {incoming.map((req) => (
            <Card key={req.id} padding="sm">
              <p className="font-medium text-gray-900">
                {req.profile?.fullName ?? "Someone"} wants to connect
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="touch-manipulation" onClick={() => void handleAccept(req.id)}>
                  <UserCheck className="w-4 h-4" /> Accept
                </Button>
                <Button variant="outline" size="sm" onClick={() => void handleDecline(req.id)}>
                  Decline
                </Button>
              </div>
            </Card>
          ))}
          {outgoing.map((req) => (
            <Card key={req.id} padding="sm" className="bg-gray-50/50">
              <p className="text-sm text-gray-600">
                Pending request to {req.profile?.fullName ?? "user"}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {searchError ? (
            <Card padding="md" className="text-center space-y-2 border-red-100 bg-red-50/50">
              <p className="text-sm font-medium text-red-700">{searchError}</p>
              <Button size="sm" variant="outline" onClick={() => void handleSearch()} className="touch-manipulation">
                Try again
              </Button>
            </Card>
          ) : results.length === 0 ? (
            <Card padding="md" className="text-center space-y-2">
              {searched ? (
                <>
                  <p className="text-sm font-medium text-gray-900">No user found.</p>
                  <p className="text-sm text-gray-500">
                    Make sure they signed up with that email.
                  </p>
                  <Link href="/invite" className="inline-block pt-1">
                    <Button size="sm" variant="secondary" className="touch-manipulation">
                      Invite them instead
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-sm text-gray-500">Search for friends by name or email</p>
              )}
            </Card>
          ) : (
            results.map((user) => (
              <Card key={user.id} padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">
                    {(user.fullName ?? user.email ?? "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.fullName ?? "Gardener"}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <Button size="sm" className="touch-manipulation" onClick={() => void handleSend(user.id)}>
                    <UserPlus className="w-4 h-4" /> Add
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <Card padding="sm" className="border-dashed">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Ban className="w-4 h-4 shrink-0" />
          <p>Block users from their profile or contact support. Blocked users cannot see your activity.</p>
        </div>
      </Card>
    </div>
  );
}

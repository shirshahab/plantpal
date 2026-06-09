import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SocialChallenge } from "@/lib/social/types";
import { CHALLENGE_TEMPLATES } from "@/lib/social/constants";

function templateToChallenge(
  tpl: (typeof CHALLENGE_TEMPLATES)[number],
  id: string,
  progress = 0
): SocialChallenge {
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 14);
  return {
    id,
    scope: "personal",
    groupId: null,
    title: tpl.title,
    description: tpl.description,
    challengeType: tpl.challengeType,
    target: tpl.target,
    unit: tpl.unit,
    rewardXp: tpl.rewardXp,
    rewardBadge: tpl.rewardBadge,
    startsAt: new Date().toISOString(),
    endsAt: endsAt.toISOString(),
    progress,
    completedAt: progress >= tpl.target ? new Date().toISOString() : null,
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    const demo = CHALLENGE_TEMPLATES.slice(0, 2).map((t, i) =>
      templateToChallenge(t, `demo-challenge-${i}`, i === 0 ? 3 : 0)
    );
    return NextResponse.json({ ok: true, challenges: demo, storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const demo = CHALLENGE_TEMPLATES.slice(0, 1).map((t) => templateToChallenge(t, "demo-1", 2));
    return NextResponse.json({ ok: true, challenges: demo, storage: "demo" as const });
  }

  const { data: participations } = await supabase
    .from("challenge_participants")
    .select("*, challenges(*)")
    .eq("user_id", user.id)
    .is("completed_at", null)
    .limit(5);

  const challenges: SocialChallenge[] = (participations ?? []).map((p) => {
    const c = p.challenges as {
      id: string;
      scope: string;
      group_id: string | null;
      title: string;
      description: string;
      challenge_type: string;
      target: number;
      unit: string;
      reward_xp: number;
      reward_badge: string | null;
      starts_at: string;
      ends_at: string;
    };
    return {
      id: c.id,
      scope: c.scope as SocialChallenge["scope"],
      groupId: c.group_id,
      title: c.title,
      description: c.description ?? "",
      challengeType: c.challenge_type as SocialChallenge["challengeType"],
      target: c.target,
      unit: c.unit,
      rewardXp: c.reward_xp,
      rewardBadge: c.reward_badge,
      startsAt: c.starts_at,
      endsAt: c.ends_at,
      progress: p.progress,
      completedAt: p.completed_at,
    };
  });

  if (challenges.length === 0) {
    return NextResponse.json({
      ok: true,
      challenges: [templateToChallenge(CHALLENGE_TEMPLATES[0], "suggested-1", 2)],
      storage: "suggested" as const,
    });
  }

  return NextResponse.json({ ok: true, challenges });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, storage: "local" as const });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  const action = body.action as string;

  if (action === "join") {
    const templateIndex = Number(body.templateIndex ?? 0);
    const tpl = CHALLENGE_TEMPLATES[templateIndex] ?? CHALLENGE_TEMPLATES[0];
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 14);

    const { data: challenge } = await supabase
      .from("challenges")
      .insert({
        scope: (body.scope as string) ?? "personal",
        group_id: (body.groupId as string) ?? null,
        created_by: user.id,
        title: tpl.title,
        description: tpl.description,
        challenge_type: tpl.challengeType,
        target: tpl.target,
        unit: tpl.unit,
        reward_xp: tpl.rewardXp,
        reward_badge: tpl.rewardBadge,
        ends_at: endsAt.toISOString(),
      })
      .select("id")
      .single();

    if (challenge) {
      await supabase.from("challenge_participants").insert({
        challenge_id: challenge.id,
        user_id: user.id,
        progress: 0,
      });
    }

    return NextResponse.json({ ok: true, challengeId: challenge?.id });
  }

  if (action === "progress") {
    const challengeId = body.challengeId as string;
    const increment = Number(body.increment ?? 1);

    const { data: row } = await supabase
      .from("challenge_participants")
      .select("*, challenges(target, reward_xp, reward_badge, title)")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .single();

    if (!row) {
      return NextResponse.json({ ok: false, error: "Not enrolled" }, { status: 404 });
    }

    const target = (row.challenges as { target: number }).target;
    const nextProgress = Math.min(row.progress + increment, target);
    const completed = nextProgress >= target;

    await supabase
      .from("challenge_participants")
      .update({
        progress: nextProgress,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", row.id);

    if (completed) {
      await supabase.from("social_notifications").insert({
        user_id: user.id,
        notification_type: "challenge_completed",
        title: "Challenge completed!",
        body: (row.challenges as { title: string }).title,
        link: "/dashboard",
      });

      await supabase.from("activity_feed").insert({
        user_id: user.id,
        event_type: "challenge_completed",
        title: `completed ${(row.challenges as { title: string }).title}`,
        visibility: "friends",
        emoji: "🏆",
      });
    }

    return NextResponse.json({ ok: true, progress: nextProgress, completed });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

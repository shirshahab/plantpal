# Academy Sync Plan

PlantPal Academy currently stores all progress in the browser. This document describes the current state, planned Supabase schema, migration path, conflict handling, and offline behavior.

## Current State (localStorage)

| Key | Contents |
|-----|----------|
| `plantpal-academy` | Full `AcademyProgress`: XP, streak, badges, certificates, completed lessons, streak freezes, badge unlock timestamps, XP log |
| `plantpal-education` | Legacy mirror: `completedLessons`, `passedQuizzes` only (kept in sync for older UI) |

**XP events wired today**

| Event | Source | XP |
|-------|--------|-----|
| `lesson_completed` + `quiz_passed` | Academy lesson page | 25 + 50 |
| `plant_added` | `plants-provider` | 10 |
| `diagnosis_completed` | `engagement-provider` (scan) | 15 |
| `growth_photo` | `engagement-provider` | 10 |
| `daily_login` | `academy-provider` on load | 5 |
| `task_completed` | `tasks-provider` | 5 |
| `price_check_completed` | `price-checker-panel` | 10 |
| `daily_mission_completed` | `journey-provider` | 20 |

**Pending (not wired)**

| Event | Notes |
|-------|-------|
| `plant_healthy_30d` | Needs cron/job to detect 30 consecutive healthy days per plant |

Cross-app XP uses `emitAwardXp()` → `CustomEvent` → `AcademyProvider.subscribeAwardXp`.

## Future Supabase Tables

Migration file: `supabase/migrations/007_academy.sql`

| Table | Purpose |
|-------|---------|
| `academy_profiles` | One row per user: total_xp, streak fields, family_mode, streak_freezes |
| `academy_lesson_progress` | Per-lesson completion + quiz pass timestamps |
| `academy_badges` | Unlocked badges with `unlocked_at` |
| `academy_certificates` | Earned path certificates |
| `academy_xp_log` | Append-only XP event log for audit and conflict resolution |

## Migration Path

1. **Phase A — Read-through (no breaking changes)**  
   On login, fetch Supabase profile. If empty and localStorage has data, upload local snapshot once (`migrated_at` flag on profile).

2. **Phase B — Dual-write**  
   Every `persist()` in `AcademyProvider` writes localStorage + upserts Supabase (debounced 2s). XP log inserts are append-only.

3. **Phase C — Supabase source of truth**  
   Load from Supabase on init; localStorage becomes offline cache only.

4. **Lesson content**  
   Stays static in repo (`src/lib/academy/`). No DB sync needed for lesson copy.

## Conflict Handling

- **XP total**: Use `max(local, remote)` on merge; reconcile from `academy_xp_log` if totals diverge by >50 XP.
- **Completed lessons**: Union of local + remote lesson IDs (lessons are idempotent).
- **Streak**: Prefer the row with the more recent `last_active_date`; if same day, take higher `current_streak`.
- **Badges / certificates**: Union; keep earliest `unlocked_at` per badge.
- **Streak freezes**: Take `max(local, remote)` count; never restore a used freeze.

Server should reject duplicate XP log entries with same `(user_id, type, at)` within a 60s window.

## Offline Mode

- All Academy UI works offline via localStorage (current behavior).
- When offline, queue Supabase writes in IndexedDB or a `pending_sync` array on `AcademyProgress`.
- On reconnect, flush queue in order: profile → lesson progress → badges → XP log.
- Show subtle “Synced” / “Saved locally” indicator using existing sync provider patterns.

## Not in Scope Yet

- Paid streak freeze purchases
- Real image assets for `image_identify` quizzes
- Leaderboards backed by Supabase
- `plant_healthy_30d` automated award

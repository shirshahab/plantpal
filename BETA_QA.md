# PlantPal Beta QA Checklist

Run this before inviting 5–10 real testers. Check each item on **mobile** (primary) and desktop.

## Account & onboarding

- [ ] Sign up with email at `/signup`
- [ ] Log in at `/login`
- [ ] Complete onboarding (ZIP, goals, experience)
- [ ] Land on `/beta-start` or `/dashboard` without errors
- [ ] Founder Mode ON (Settings → Developer Tools) — no paywalls during testing

## Beta flow

- [ ] `/beta-start` loads — welcome, what to test, known issues visible
- [ ] **Start with Demo Garden** loads 5 plants on Dashboard
- [ ] **Start with My Own Plants** opens Add Plant wizard
- [ ] `/tester-guide` loads with all 5 steps and links work

## Add plant

- [ ] Scan plant path → Scanner → Add to garden → wizard pre-fills
- [ ] Search plant path → pick species → photo → details → goals → save
- [ ] Manual add path works
- [ ] “Add now, photo later” + placeholder image works
- [ ] Plant appears on `/plants` and detail page

## Scanner

- [ ] Camera opens on mobile (HTTPS required)
- [ ] Identify returns result or clear “not configured” message (no fake demo unless demo mode)
- [ ] Confidence % and Live AI / Pl@ntNet badges visible
- [ ] Retake photo works
- [ ] AI safety label visible: “PlantPal can make mistakes…”

## Today & Dashboard

- [ ] `/dashboard` shows: health, tasks, seasonal alert, learning, quick actions
- [ ] `/today` shows care tasks
- [ ] Mark watering / complete task works
- [ ] Empty task state shows friendly message

## Plant detail

- [ ] Photo, name, health, size, location, goal visible
- [ ] Water, Scan, Add Photo, Care Plan, Edit buttons work
- [ ] Timeline / Tasks / Notes tabs work
- [ ] Remove plant with confirmation works

## Academy

- [ ] `/academy` loads paths and daily lesson
- [ ] Complete one lesson — XP / progress updates
- [ ] Send Feedback button visible

## Price checker

- [ ] `/price-checker` loads (Founder Mode unlocked)
- [ ] Search with plant name + ZIP returns results or clear error

## Feedback

- [ ] “Send Feedback” on Dashboard, Scanner, Add Plant, Plant Detail, Academy
- [ ] All 5 types work: Bug, Confusing, Wrong plant result, Missing feature, Love this
- [ ] Submission succeeds (Supabase `beta_feedback` or localStorage fallback)
- [ ] Settings full feedback panel still works

## Mobile install (PWA)

- [ ] Install prompt appears on supported browsers
- [ ] App icon on home screen opens PlantPal
- [ ] Bottom nav doesn’t cover primary CTAs (Save, Water, Scan)
- [ ] Forms readable — text not too small

## Production deploy

- [ ] `npm run build` passes
- [ ] Env vars set on Vercel: `OPENAI_API_KEY`, Supabase URL + anon key
- [ ] Optional: `PLANTNET_API_KEY` for scanner second opinion
- [ ] Supabase migration run (`FIX_RUN_THIS.sql` includes `beta_feedback` table)

## Sign-off

| Tester | Date | Device | Pass / Fail | Notes |
|--------|------|--------|-------------|-------|
|        |      |        |             |       |

---

**Ready for beta when:** All critical paths (signup, add plant, scan, task, lesson, feedback) pass on one real phone.

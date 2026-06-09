# PlantPal MVP

## What PlantPal is

PlantPal is a **mobile-first plant care coach** — track every plant, know what to do today, diagnose problems from photos, and get local climate-aware advice.

Think: daily command center + garden tracker + AI vision + learning — in one installable PWA.

## Current features

- **Garden dashboard** — health score, local care card, top tasks
- **Today / Calendar** — watering, fertilizing, weather-aware tasks
- **Add plant wizard** — species search, goals, climate check
- **Plant Camera** — identify, diagnose, scan nursery tags, progress photos
- **AI care plans & Plant Doctor** — per-plant recommendations
- **Plant database** — 180+ species + optional Perenual API
- **Price checker** — fair range before buying at the nursery
- **Plant Journey** — goals, milestones, missions
- **Learn** — gamified care lessons
- **Onboarding + demo garden** — 60-second first impression
- **PWA** — install to home screen

## What is real vs mock

| Layer | Real when configured | Mock fallback |
|-------|---------------------|---------------|
| Auth & plants (cloud) | Supabase + login | localStorage |
| AI vision & plans | `OPENAI_API_KEY` | Smart mock |
| Weather tasks | `OPENWEATHER_API_KEY` | ZIP-based mock |
| Plant search API | `PERENUAL_API_KEY` | Internal DB |
| Scanner backup | `PLANTNET_API_KEY` | OpenAI only |
| Live prices | `SERPAPI_KEY` | Estimated ranges |

The app is designed to **always work** without API keys — critical for demos and first-time users.

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + TypeScript
- **Tailwind CSS 4**
- **Supabase** — auth, Postgres, storage, RLS
- **OpenAI** — vision + structured JSON responses
- **PWA** — manifest + service worker

## Live APIs supported

- OpenAI (vision, care, doctor, price AI)
- OpenWeather (daily tasks + local care)
- Perenual (plant database enrichment)
- Pl@ntNet (identification second opinion)
- SerpAPI (Google Shopping price search)
- Zippopotam.us (ZIP geocoding, no key)

## Demo instructions

1. Open `/` → **Explore Demo Garden**
2. Or use `/demo-script` for a step-by-step pitch
3. Best on mobile with PWA installed

Demo garden includes: Meyer Lemon, Japanese Maple, Bougainvillea, Avocado, Fiddle Leaf Fig (Pasadena ZIP 91107) with tasks, AI plan, scans, and growth timeline pre-loaded.

## Setup for real testers

1. `.env.local` with Supabase keys
2. Run `supabase/FIX_RUN_THIS.sql`
3. Open `/setup` — all required checks green
4. Create account at `/login`
5. See `TESTING.md` for full QA flow

## Next roadmap (post-MVP)

- Push notifications (reminder delivery)
- Community / shared gardens
- AR garden preview (concept page exists)
- Deeper Supabase sync for all providers
- App Store / Play Store wrappers
- PNG app icons for all PWA sizes

## Quick links

- Setup checker: `/setup`
- QA checklist: `/qa`
- Demo script: `/demo-script`
- Integration health: `/settings/integrations`

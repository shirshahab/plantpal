# PlantPal — Testing Guide

## Local setup

1. Clone the repo and run `npm install`
2. Copy `.env.local.example` → `.env.local`
3. Run `npm run dev` (default http://localhost:3000 or 3001)
4. Open `/setup` to verify configuration

### Without Supabase (fastest)

Leave Supabase env vars empty. The app runs in **mock mode** — all data stays in browser localStorage.

- Landing → **Explore Demo Garden** loads a full Pasadena demo
- No login required

### With Supabase (real cloud testing)

1. Create a project at [supabase.com](https://supabase.com)
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
3. Run `supabase/FIX_RUN_THIS.sql` in Supabase SQL Editor
4. Restart `npm run dev`
5. Sign up at `/login`
6. Re-run `/setup` — tables and storage should show OK

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | For cloud | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For cloud | Public anon key |
| `OPENAI_API_KEY` | Optional | Live AI vision, care plans, doctor |
| `OPENWEATHER_API_KEY` | Optional | Live weather |
| `WEATHER_PROVIDER=openweather` | Optional | Enable OpenWeather |
| `PERENUAL_API_KEY` | Optional | External plant database |
| `PLANTNET_API_KEY` | Optional | Scanner second opinion |
| `SERPAPI_KEY` | Optional | Live nursery price search |

Without optional keys, the app uses **smart mock fallbacks** — it should never crash.

## Test user flow (15 minutes)

1. `/` → Start Free → complete `/onboarding`
2. Choose **Explore Demo Garden** OR add a plant at `/plants/new`
3. `/today` — complete or skip a task
4. `/plants/1` — view Meyer Lemon, generate AI care plan
5. `/scanner` — identify or diagnose a photo
6. `/price-checker` — Avocado, 3 gallon, ZIP 91107
7. `/learn` — open one lesson
8. `/settings` → Setup checker

## Demo flow (investor pitch)

Use `/demo-script` — tap **Load Demo** first, then follow the 10 steps on mobile.

## Mock fallbacks (expected without API keys)

| Feature | Without key |
|---------|-------------|
| AI identify / diagnose / care plan | Smart mock JSON |
| Weather | Climate mock from ZIP table |
| Plant database search | Internal seed + mock |
| Price checker | Estimated fair ranges |
| Perenual / Pl@ntNet / SerpAPI | Skipped or mock |

## Common errors and fixes

| Symptom | Fix |
|---------|-----|
| "Table missing" on add plant | Run `supabase/FIX_RUN_THIS.sql`, restart dev server |
| Add plant fails when logged in | Sign out and back in; check `/setup` RLS |
| PGRST205 after SQL run | Restart `npm run dev`, hard-refresh browser |
| AI always says mock | Add `OPENAI_API_KEY`, restart dev server |
| Blank plants after login | Normal — new account starts empty; use demo or add plant |
| Bottom nav covers button | Fixed with `pb-28` padding — report if still happening |

## Mobile testing checklist

- [ ] Install PWA from dashboard (iOS Share → Add to Home Screen)
- [ ] Bottom nav visible on all app routes
- [ ] Add plant wizard scrolls fully; Save button reachable
- [ ] Camera capture works on `/scanner`
- [ ] No horizontal scroll on iPhone width
- [ ] `/today` tasks tappable (complete / skip)
- [ ] Pull-to-refresh on dashboard (mobile)

## Developer tools (dev only)

Settings → **Developer Tools** (visible when `NODE_ENV=development`):

- Load Demo Garden
- Clear Local Data
- Reset Onboarding / AI Cache / Tasks
- Run Setup Check

## Automated checks

```bash
npm run lint
npm run build
```

Manual QA checklist: `/qa`

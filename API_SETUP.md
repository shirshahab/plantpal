# PlantPal API Setup Guide

This document explains how to connect live data sources for PlantPal. **Mock fallbacks always remain** — the app works without any keys.

## Quick start

1. Copy `.env.local.example` → `.env.local`
2. Paste keys for the integrations you want (never commit `.env.local`)
3. Restart `npm run dev`
4. Open `/debug/data-sources` to verify configured vs active status

For production (Vercel): Project → Settings → Environment Variables → add the same names → redeploy.

---

## Environment variables

| Variable | Required for | Get key from |
|----------|--------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Database, auth, photos | [supabase.com](https://supabase.com) → Project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same | Same |
| `OPENAI_API_KEY` | AI Doctor, care plans, scanner fallback, price AI | [platform.openai.com](https://platform.openai.com/api-keys) |
| `PLANT_ID_API_KEY` | Primary plant ID (optional) | [web.plant.id](https://web.plant.id/) |
| `OPENWEATHER_API_KEY` | Live weather on `/today` | [openweathermap.org/api](https://openweathermap.org/api) |
| `WEATHER_PROVIDER` | Force provider (`openweather`) | Set to `openweather` when using OpenWeather |
| `PERENUAL_API_KEY` | Plant database search | [perenual.com/subscription-api-pricing](https://perenual.com/subscription-api-pricing) |
| `PLANTNET_API_KEY` | Scanner second opinion | [my.plantnet.org](https://my.plantnet.org/) |
| `SERPAPI_KEY` | Live shopping prices | [serpapi.com](https://serpapi.com/) |

No keys needed (built-in):

- **Zippopotam** — free ZIP geocoding (no API key)
- **USDA zone lookup** — internal ZIP → zone tables
- **Soil / fertilizer / pest / disease databases** — internal seed data (+ Supabase when migrated)

---

## What each integration powers

### OpenAI
- Plant health scans, care recommendations, landscape AI, price-check AI analysis
- Plant search AI suggestion (step 3 in search pipeline)
- **Fallback:** Smart mock responses when key missing

### Supabase
- User plants, profiles, photos, subscriptions, `plant_species` cache
- **Fallback:** localStorage mock mode when env vars missing

### OpenWeather
- Live temp, humidity, wind, rain on `/today` and weather cards
- **Fallback:** Climate-aware mock from ZIP profile
- **Cache:** 45 minutes per ZIP (server memory)

### Perenual
- External plant search after Supabase `plant_species`
- Import on select → dedupe by `scientific_name` → save to Supabase
- **Fallback:** Skip to OpenAI suggestion → mock seed search

### Pl@ntNet
- Second opinion under scanner identification results
- **Fallback:** Message: “Optional Pl@ntNet second opinion not connected”

### Plant.id
- Primary identification when `PLANT_ID_API_KEY` set (before OpenAI)
- **Fallback:** OpenAI Vision → mock

### SerpAPI
- Google Shopping results in Price Checker (`/api/prices/search`)
- **Fallback:** Estimated price ranges from mock calculator
- **Cache:** 60 minutes per plant+size+ZIP
- **Limits:** 15 searches/day, 5/minute burst (skipped when `NEXT_PUBLIC_BETA_UNLOCK_ALL=true`)

---

## Plant search order

1. Supabase `plant_species` (or internal seed if Supabase empty/unconfigured)
2. Perenual API (if `PERENUAL_API_KEY`)
3. OpenAI single-plant suggestion (if `OPENAI_API_KEY`)
4. Mock seed fallback

Source badges appear on each result in species search.

---

## Testing checklist

### No keys
- [ ] App loads; plant search uses seed/mock
- [ ] `/today` shows “Mock fallback” weather badge
- [ ] Price checker shows “Estimated price”
- [ ] Scanner works with mock identification

### OpenAI only
- [ ] AI features return live responses (badge: AI generated)
- [ ] Weather and shopping still mock

### OpenWeather
- [ ] Set `OPENWEATHER_API_KEY` + `WEATHER_PROVIDER=openweather`
- [ ] `/today` shows “Live weather” badge
- [ ] Refresh within 45 min — no extra API calls (cached)

### Perenual
- [ ] Search “monstera” — Perenual badge on external hits
- [ ] Select Perenual plant — imports to Supabase (check `/debug/supabase`)

### SerpAPI
- [ ] Price checker → “Live shopping result” section with retailer links

### Debug page
- [ ] Visit `/debug/data-sources` — configured/active/last source/fallback/error columns

---

## Vercel deployment

1. Vercel dashboard → your PlantPal project → **Settings** → **Environment Variables**
2. Add each variable for **Production** (and Preview if desired)
3. **Do not** prefix server-only keys with `NEXT_PUBLIC_` except Supabase URL/anon key and beta flag
4. Redeploy after saving

---

## Rough monthly cost (light beta usage)

| Service | Free tier | Typical beta (~50 users) |
|---------|-----------|---------------------------|
| OpenAI | Pay per use | $5–30/mo depending on scans |
| OpenWeather | 1,000 calls/day free | $0 (with caching) |
| Perenual | Limited free tier | $0–10/mo |
| Pl@ntNet | Free quota | $0 |
| Plant.id | Paid plans | $0–15/mo if used heavily |
| SerpAPI | 100 searches/mo free | $0–50/mo if price checker is popular |
| Supabase | Free tier | $0 |

Caching and rate limits reduce surprise bills. See `src/lib/api/server-cache.ts` and `src/lib/api/rate-limit.ts`.

---

## Security notes

- Never commit `.env.local` or paste keys in chat/issues
- `/debug/data-sources` shows **configured yes/no** only — never secret values
- Rotate keys immediately if exposed

---

## Related files

- `.env.local.example` — template
- `/debug/data-sources` — runtime status UI
- `src/lib/data-sources/runtime.ts` — source tracking
- `src/lib/integrations/` — weather, Perenual, SerpAPI, Pl@ntNet

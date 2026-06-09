# PlantPal Mobile — Internal QA (pre–store submission)

Run on **physical devices** after `eas build --profile preview` or Expo Go with `.env` configured.

## Environment

- [ ] `.env` has valid Supabase URL + anon key
- [ ] `EXPO_PUBLIC_API_BASE_URL=https://getplantpal.com` (or staging URL)
- [ ] Backend live — `/api/ai/identify-plant` returns JSON (not 502)

## Auth

- [ ] Sign up with new email
- [ ] Sign in with existing account
- [ ] Session persists after app restart (SecureStore)
- [ ] Sign out from More tab
- [ ] Logout clears session

## Core tabs

- [ ] **Today** — loads without crash
- [ ] **Garden** — lists plants from Supabase (or empty state)
- [ ] **Add** — save plant with name + species
- [ ] **Add** — take photo / pick from library
- [ ] **Scan** — camera permission prompt
- [ ] **Scan** — capture & identify calls API
- [ ] **Scan** — AI safety disclaimer visible
- [ ] **Scan** — “Add to garden” pre-fills Add tab
- [ ] **Academy** — loads paths / hero
- [ ] **More** — shows account + API URL
- [ ] **More** — web links open in browser

## API

- [ ] Identify plant returns result or clear error (not silent fail)
- [ ] No secret keys in app bundle (grep APK/IPA — should not find `sk-`)

## Notifications

- [ ] Permission prompt appears (placeholder registered on launch)
- [ ] No crash if permission denied

## Account deletion path

- [ ] Support link or email for deletion documented ([DATA_DELETION.md](./DATA_DELETION.md))
- [ ] In-app delete (when shipped) or email flow tested

## Sign-off

| Tester | Device | OS | Date | Pass/Fail | Notes |
|--------|--------|-----|------|-----------|-------|
| | | | | | |

**Gate:** All auth + scan + add plant flows pass before TestFlight / Play Internal upload.

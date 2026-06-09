# PlantPal Mobile

Native iOS and Android app for PlantPal — built with **Expo React Native**.

Reuses the existing PlantPal **Next.js backend** (API routes on Vercel), **Supabase** auth/database/storage, and brand system. No backend rewrite required.

## Tabs

| Tab | Screen |
|-----|--------|
| Today | Daily care overview |
| Garden | Plant list from Supabase |
| Add | Manual add + photo picker |
| Scan | Expo Camera → `/api/ai/identify-plant` |
| Academy | Learning paths (syncs with web) |
| More | Account, web links, settings |

## Setup

```bash
cd plantpal-mobile
cp .env.example .env
# Edit .env with your Supabase + API URL

npm install
npx expo start
```

### Replace app icon

Copy official PlantPal icons from the web project:

```bash
# From repo root, after running npm run icons:generate
cp public/app-icon.png plantpal-mobile/assets/images/icon.png
cp public/android-chrome-512x512.png plantpal-mobile/assets/images/android-icon-foreground.png
```

Update splash background is already `#2D6A4F` (brand primary).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Deployed PlantPal web URL (e.g. `https://your-app.vercel.app`) |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Same as web `NEXT_PUBLIC_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Same as web anon key |

**Server-only keys** (OpenAI, PlantNet, OpenWeather, Perenual, SerpAPI) stay on Vercel — never in the mobile app.

## Run on your phone

### Expo Go (fastest)

```bash
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android).

> Camera and secure storage work best in a **development build** (see below).

### Development build

```bash
npm install -g eas-cli
eas login
eas init
eas build --profile development --platform ios   # or android
```

Install the build on your device, then:

```bash
npx expo start --dev-client
```

### Local Android emulator

```bash
npx expo run:android
```

### Local iOS simulator (macOS only)

```bash
npx expo run:ios
```

## Build for stores

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

See:
- [APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md)
- [PLAY_STORE_CHECKLIST.md](./PLAY_STORE_CHECKLIST.md)
- [PRIVACY_DISCLOSURES.md](./PRIVACY_DISCLOSURES.md)
- [STORE_LISTING_COPY.md](./STORE_LISTING_COPY.md)

## Deep links

- Custom scheme: `plantpal://`
- Universal links: `https://plantpal.app/*` (configure DNS + Apple/Google verification)

## Architecture

```
plantpal-mobile (Expo)
  ├── Supabase auth (SecureStore session)
  ├── Supabase plants table (direct read/write)
  └── HTTPS → EXPO_PUBLIC_API_URL/api/*
        ├── /api/ai/identify-plant  (OpenAI + PlantNet)
        ├── /api/ai/care-plan
        ├── /api/feedback
        └── … (all existing Next.js routes)
```

## Expo dependencies

| Package | Purpose |
|---------|---------|
| `expo` ~56 | SDK |
| `expo-router` | File-based navigation + tabs |
| `@supabase/supabase-js` | Auth + database |
| `expo-camera` | Plant scanner |
| `expo-image-picker` | Add plant photos |
| `expo-secure-store` | Auth token storage |
| `expo-notifications` | Push placeholder |
| `expo-file-system` | Base64 encode for API |
| `expo-linking` | Deep links |
| `expo-dev-client` | EAS development builds |
| `@expo/vector-icons` | Tab icons |

## Scripts

```bash
npm start          # Expo dev server
npm run android    # Expo Go on Android
npm run ios        # Expo Go on iOS
```

Add to `package.json` after `eas init`:

```bash
eas build --platform all --profile production
eas submit --platform all --profile production
```

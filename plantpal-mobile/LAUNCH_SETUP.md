# PlantPal Mobile — Launch Setup Summary

Phase 33 store launch configuration for iOS App Store and Google Play.

## Quick start (local)

```bash
cd plantpal-mobile
cp .env.example .env   # or use existing .env
npm install
npx expo start
```

Scan QR with **Expo Go**. Camera works best in an EAS dev build.

## Environment (client-safe only)

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_BASE_URL=https://getplantpal.com
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
```

In-app subscriptions: **More → Upgrade (in-app paywall)** opens `/upgrade` in a WebView with the RevenueCat bridge.

**Never** put OpenAI, PlantNet, SerpAPI, OpenWeather, or Perenual keys in the mobile app.

## App identity

| Field | Value |
|-------|--------|
| Name | PlantPal |
| Slug | plantpal |
| Scheme | plantpal |
| iOS bundle | com.getplantpal.app |
| Android package | com.getplantpal.app |
| API | https://getplantpal.com |

Config file: `app.config.ts` (replaces `app.json`)

## EAS builds

```bash
npm install -g eas-cli
eas login
eas init                    # links Expo project, sets projectId
eas build --platform android --profile preview   # APK for testing
eas build --platform ios --profile preview       # requires Apple Developer
eas build --platform android --profile production  # AAB for Play Store
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

## Store docs

| File | Purpose |
|------|---------|
| [APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md) | Apple submission |
| [PLAY_STORE_CHECKLIST.md](./PLAY_STORE_CHECKLIST.md) | Google submission |
| [STORE_LISTING_COPY.md](./STORE_LISTING_COPY.md) | Descriptions & keywords |
| [PRIVACY_DISCLOSURES.md](./PRIVACY_DISCLOSURES.md) | Privacy labels |
| [DATA_DELETION.md](./DATA_DELETION.md) | Account deletion |
| [INTERNAL_QA.md](./INTERNAL_QA.md) | Pre-upload testing |
| [store-assets/README.md](./store-assets/README.md) | Screenshot specs |

## Replace before submission

1. `assets/icon.png` — 1024×1024 official PlantPal icon
2. `store-assets/*.png` — real device screenshots
3. `app.config.ts` → `extra.eas.projectId` after `eas init`
4. EAS secrets for Supabase env vars on cloud builds

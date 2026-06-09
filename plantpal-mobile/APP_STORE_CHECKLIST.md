# App Store Submission Checklist — PlantPal

Bundle ID: `com.getplantpal.app`  
Production API: `https://getplantpal.com`

## Apple Developer account

- [ ] Enrolled in Apple Developer Program ($99/year)
- [ ] Bundle ID `com.getplantpal.app` registered in Certificates, Identifiers & Profiles
- [ ] Push Notifications capability (when enabling reminders)
- [ ] Associated Domains: `applinks:getplantpal.com`

## Expo / EAS

- [ ] `npm install -g eas-cli`
- [ ] `eas login`
- [ ] `eas init` — set `extra.eas.projectId` in `app.config.ts`
- [ ] Set EAS secrets: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Replace `assets/icon.png` with 1024×1024 official PlantPal icon
- [ ] Replace `store-assets/iphone-screenshot-*.png` with real device screenshots
- [ ] `eas build --platform ios --profile preview` (internal test)
- [ ] `eas build --platform ios --profile production` (TestFlight / App Store)

## App Store Connect

- [ ] App created: **PlantPal**
- [ ] Primary category: Lifestyle or Education
- [ ] Age rating questionnaire completed
- [ ] **Privacy policy URL:** https://getplantpal.com/privacy
- [ ] **Terms URL:** https://getplantpal.com/terms
- [ ] **Support URL:** https://getplantpal.com/about (or dedicated support page)

## App Privacy (Nutrition Labels)

Complete using [PRIVACY_DISCLOSURES.md](./PRIVACY_DISCLOSURES.md):

- [ ] Email — account
- [ ] Photos — app functionality + linked to user
- [ ] User content — plant names, ZIP
- [ ] Data used for tracking: No (unless analytics added)

## Metadata

- [ ] App name, subtitle, description from [STORE_LISTING_COPY.md](./STORE_LISTING_COPY.md)
- [ ] Keywords entered
- [ ] Screenshots: 6.7", 6.5", 5.5" iPhone (required sizes)
- [ ] App preview video (optional)

## TestFlight

- [ ] Upload build via `eas submit --platform ios`
- [ ] Internal testers invited (your team)
- [ ] External beta (optional) after internal pass

## Review notes for Apple

- [ ] Demo account email/password in Review Notes (if login required)
- [ ] Explain camera is required for plant identification
- [ ] Confirm `https://getplantpal.com` API is live during review
- [ ] Note AI-generated content disclaimer

## Pre-submit QA

Run [INTERNAL_QA.md](./INTERNAL_QA.md) on a physical iPhone.

## Submit for review

- [ ] Select production build in App Store Connect
- [ ] Submit for review
- [ ] Monitor rejection feedback — respond within 24 hours

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

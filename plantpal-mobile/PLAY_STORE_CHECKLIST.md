# Google Play Store Submission Checklist — PlantPal

Package name: `com.getplantpal.app`  
Production API: `https://getplantpal.com`

## Google Play Console

- [ ] Developer account created ($25 one-time fee)
- [ ] App created: **PlantPal**
- [ ] Package name matches `app.config.ts`: `com.getplantpal.app`

## Signing & EAS build

- [ ] `eas login`
- [ ] `eas init`
- [ ] Google Play service account JSON → `google-play-service-account.json` (gitignored)
- [ ] Preview APK for device testing:
  ```bash
  eas build --platform android --profile preview
  ```
- [ ] Production AAB for Play Store:
  ```bash
  eas build --platform android --profile production
  ```

## Store listing

- [ ] Short & full description from [STORE_LISTING_COPY.md](./STORE_LISTING_COPY.md)
- [ ] App icon 512×512 (`store-assets/app-icon.png`)
- [ ] Feature graphic 1024×500 (`store-assets/feature-graphic.png`)
- [ ] Phone screenshots (min 2) — replace placeholders in `store-assets/`
- [ ] **Privacy policy URL:** https://getplantpal.com/privacy

## Data safety form

Complete using [PRIVACY_DISCLOSURES.md](./PRIVACY_DISCLOSURES.md):

- [ ] Data collected: email, photos, user-generated content, app activity
- [ ] Data encrypted in transit
- [ ] Users can request deletion — link [DATA_DELETION.md](./DATA_DELETION.md) or privacy page
- [ ] No sale of personal data

## Content rating

- [ ] IARC questionnaire completed
- [ ] Target audience: general users, not designed for children under 13

## Permissions

- [ ] `CAMERA` — plant identification (declared in Play Console)
- [ ] `READ_MEDIA_IMAGES` — photo upload
- [ ] `POST_NOTIFICATIONS` — care reminders (future)

## Internal testing track

- [ ] Upload AAB to **Internal testing**
- [ ] Add tester emails (5–10 people)
- [ ] Run [INTERNAL_QA.md](./INTERNAL_QA.md) on Android devices
- [ ] Fix blockers before Closed/Open testing

## Production release

- [ ] Promote from Internal → Closed → Open (optional) → Production
- [ ] Do **not** publish publicly until internal QA passes

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

## Blockers to watch

- Missing real screenshots (placeholders will be rejected)
- Privacy policy URL must load without login
- API at getplantpal.com must respond during Google review

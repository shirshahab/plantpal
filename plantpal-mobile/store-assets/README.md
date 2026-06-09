# Store assets — replace placeholders before submission

These files are **placeholders** copied from the dev icon. Replace each with real marketing assets before App Store / Play Store upload.

| File | Required size | Notes |
|------|---------------|-------|
| `app-icon.png` | 1024×1024 | No transparency (App Store) |
| `splash.png` | 1284×2778 or vector | Launch screen source |
| `iphone-screenshot-1.png` | 1290×2796 (6.7") | Today / Dashboard |
| `iphone-screenshot-2.png` | 1290×2796 | Scan / identify |
| `iphone-screenshot-3.png` | 1290×2796 | Garden / plant detail |
| `android-screenshot-1.png` | 1080×1920 min | Same scenes as iOS |
| `android-screenshot-2.png` | 1080×1920 min | |
| `android-screenshot-3.png` | 1080×1920 min | |
| `feature-graphic.png` | 1024×500 | Google Play feature graphic |

**Capture screenshots:** Run the app on a device or simulator, navigate to key screens, and export PNGs at the sizes above.

Official brand icon: run `npm run icons:generate` in the web repo root, then copy `public/app-icon.png` → `assets/icon.png` and `store-assets/app-icon.png`.

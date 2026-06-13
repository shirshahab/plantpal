# PlantPal App Store and Play Store Launch

## Architecture

| Layer | Technology |
|-------|------------|
| Web app | Next.js PWA at repo root |
| Native apps | Expo (`plantpal-mobile/`) — separate package, EAS builds |
| IAP | RevenueCat via native bridge (`window.PlantPalPurchases`) |
| Entitlements sync | RevenueCat webhook → Supabase `user_subscriptions` |

**No Capacitor or Cordova.** The main app is PWA-first; store builds use the Expo shell loading the web app or native screens.

## App identity

| Field | Value |
|-------|--------|
| App name | PlantPal |
| Subtitle | Stop killing your plants. |
| Short description | PlantPal tells you what your plants are, what's wrong with them, and what to do next. |
| Support | support@plantpal.app |
| Privacy | https://hq.getplantpal.com/privacy |
| Terms | https://hq.getplantpal.com/terms |
| iOS bundle | com.getplantpal.app |
| Android package | com.getplantpal.app |

## Subscription prices (source of truth: `src/lib/billing/pricing.ts`)

| Plan | Monthly | Yearly |
|------|---------|--------|
| PlantPal Pro | $7.99 | $59 |
| PlantPal Pro Family | $14.99 | $119 |

## Free trial

- **Duration:** 14 days, configured in **App Store Connect** and **Google Play Console**
- **Verification:** Trial access comes from RevenueCat / store entitlements only
- **No local auto-trial:** PlantPal does **not** grant production paid access through client-only `localStorage` trial state
- **Paywall CTA:** "Start 14-day free trial" starts the native store purchase flow (RevenueCat)
- **After trial:** Subscription renews automatically unless canceled in store settings
- **Copy:** "After your free trial, your subscription renews automatically unless canceled."

### How trial access works

1. User taps **Start 14-day free trial** on the paywall (native app WebView or future fully native flow).
2. App Store / Google Play applies the 14-day introductory offer.
3. RevenueCat returns an active `trialing` entitlement with store proof (`storePlatform`, `storeProductId`).
4. `/api/billing/sync` and the RevenueCat webhook update Supabase `user_subscriptions`.
5. Feature gates unlock based on **verified** subscription state only.

**Web/PWA:** Cannot start store billing. Shows "Store billing unavailable in web preview."

## IAP setup path (RevenueCat)

### 1. RevenueCat project

1. Create a RevenueCat project for PlantPal.
2. Connect **App Store Connect** and **Google Play Console**.
3. Create entitlements:
   - `pro` — Pro monthly + yearly products
   - `family` — Family monthly + yearly products
4. Map products (see product IDs below).

### 2. Store products

#### iOS (`src/lib/billing/store-products.ts`)

| Plan | Product ID |
|------|------------|
| Pro Monthly | `com.getplantpal.pro.monthly` |
| Pro Yearly | `com.getplantpal.pro.yearly` |
| Family Monthly | `com.getplantpal.family.monthly` |
| Family Yearly | `com.getplantpal.family.yearly` |

#### Android

| Plan | Product ID |
|------|------------|
| Pro Monthly | `plantpal_pro_monthly` |
| Pro Yearly | `plantpal_pro_yearly` |
| Family Monthly | `plantpal_family_monthly` |
| Family Yearly | `plantpal_family_yearly` |

### 3. App Store Connect setup

1. Create auto-renewable subscriptions in the **PlantPal Pro** subscription group.
2. Add all four iOS product IDs above.
3. Set prices ($7.99 / $59 / $14.99 / $119).
4. Add a **14-day free trial** introductory offer on each product.
5. Enable Family Sharing for Family tier if desired.
6. Add sandbox test account in review notes.

### 4. Google Play Console setup

1. Create subscriptions under **Monetize > Products > Subscriptions**.
2. Add base plans for monthly and yearly (Pro and Family).
3. Configure **14-day free trial** introductory offer.
4. Add license testers for internal testing.

### 5. Environment variables

**Next.js server (never commit):**

```env
REVENUECAT_API_KEY=sk_...           # Secret API key for subscriber verification
REVENUECAT_WEBHOOK_SECRET=...       # Authorization header value for webhooks
SUPABASE_SERVICE_ROLE_KEY=...       # Required for subscription sync
```

**Expo native app (public SDK keys only):**

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
```

Map to Next.js client if using WebView bridge:

```env
NEXT_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
```

**Never** put Apple shared secret or Google service account JSON in client code.

### 6. Webhook URL

Register in RevenueCat dashboard:

```
https://getplantpal.com/api/webhooks/revenuecat
```

Set **Authorization** header to the value of `REVENUECAT_WEBHOOK_SECRET`.

Events handled: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`, `BILLING_ISSUE`, `UNCANCELLATION`, `NON_RENEWING_PURCHASE`.

### 7. Expo mobile app (`plantpal-mobile/`)

The Expo app loads the Next.js paywall in an in-app WebView and injects `window.PlantPalPurchases`.

#### Install (already in repo)

```bash
cd plantpal-mobile
npm install
npx expo install react-native-purchases react-native-webview
```

#### Mobile environment variables

Create `plantpal-mobile/.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://getplantpal.com
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
```

Add the same keys to **EAS Secrets** for cloud builds:

```bash
eas secret:create --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value appl_...
eas secret:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value goog_...
```

#### Bridge API (injected into WebView)

```javascript
window.PlantPalPurchases = {
  isAvailable: true,
  platform: "ios" | "android",
  loadProducts: async () => StoreProductPrice[],
  purchaseProduct: async (productId) => { ok, customerInfo?, error? },
  restorePurchases: async () => { ok, customerInfo?, error? },
  getCurrentEntitlement: async () => PurchaseCustomerInfo | null,
}
```

Native ↔ web messages:

**Request (web → native):**
```json
{ "type": "PLANTPAL_PURCHASE_REQUEST", "requestId": "pp_...", "action": "purchaseProduct", "payload": { "productId": "..." } }
```

**Response (native → web):**
```json
{ "type": "PLANTPAL_PURCHASE_RESPONSE", "requestId": "pp_...", "ok": true, "payload": { "customerInfo": { ... } } }
```

#### Open paywall in mobile app

1. Run Expo dev client or EAS build (IAP requires dev client, not Expo Go for production billing).
2. **More → Upgrade (in-app paywall)** opens `/upgrade` in WebView.
3. Tap **Start 14-day free trial** — triggers StoreKit / Play Billing via RevenueCat.

#### Expo build steps

```bash
cd plantpal-mobile
npm install -g eas-cli
eas login
eas build --platform ios --profile preview      # TestFlight / device
eas build --platform android --profile preview  # Internal APK
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

#### TestFlight purchase testing

1. Create sandbox Apple ID in App Store Connect.
2. Sign out of App Store on test device (Settings → App Store).
3. Install TestFlight build.
4. Sign in to PlantPal with Supabase account (RevenueCat `app_user_id` = Supabase user ID).
5. More → Upgrade → purchase Pro monthly.
6. Confirm RevenueCat dashboard shows active `pro` entitlement.
7. Confirm `POST /api/billing/sync` updates Supabase (requires `REVENUECAT_API_KEY` on server).
8. Tap **Restore purchase** on a second install.

#### Google internal testing flow

1. Upload AAB to Play Console internal testing track.
2. Add license testers in Play Console.
3. Install from internal testing link.
4. More → Upgrade → purchase with test account.
5. Verify RevenueCat + Supabase sync.
6. Test restore and cancel in Play Store subscriptions.

#### Bridge troubleshooting

| Issue | Fix |
|-------|-----|
| Paywall says store unavailable | Open via **More → Upgrade**, not system browser |
| `RevenueCat key missing` in dev logs | Set `EXPO_PUBLIC_REVENUECAT_*_API_KEY` in `.env` |
| Product not found in offerings | Match product IDs in RevenueCat dashboard to `store-products.ts` |
| Purchase succeeds but no unlock | Check entitlements `pro` / `family` in RevenueCat; verify webhook + `/api/billing/sync` |
| Cancel does not unlock | Expected — access continues until period ends; expiration webhook downgrades tier |
| Expo Go purchase fails | Use EAS dev client build — native IAP modules require custom dev client |

Dev logs (no secrets): filter Metro console for `[plantpal-purchases]`.

### 8. Client purchase flow

1. User taps **Start 14-day free trial** on paywall.
2. `purchase-adapter.ts` calls native bridge → RevenueCat → App Store / Play Store.
3. On success, local cache updates via `applyVerifiedSubscription()`.
4. Client calls `POST /api/billing/sync` (server re-verifies via RevenueCat API).
5. Webhook updates Supabase authoritatively.

**Web/PWA preview:** Shows "Store billing unavailable in web preview" — no mock upgrades in production.

## Entitlements mapping

| Store products | RevenueCat entitlement | PlantPal tier |
|----------------|------------------------|---------------|
| pro monthly/yearly | `pro` | `plus` (Pro) |
| family monthly/yearly | `family` | `family` |

## Sandbox test checklist

### Apple (TestFlight / Sandbox)

- [ ] Sandbox Apple ID signed in on device
- [ ] Purchase Pro monthly — trial starts
- [ ] Restore purchase on second install
- [ ] Cancel in Settings → subscription expires at period end
- [ ] Webhook fires in RevenueCat dashboard
- [ ] `user_subscriptions` row updates in Supabase

### Google (Internal testing)

- [ ] License tester account added
- [ ] Install from internal testing track
- [ ] Purchase Family yearly with trial
- [ ] Restore purchase
- [ ] Cancel in Play Store subscriptions
- [ ] Verify webhook + Supabase sync

## QA checklist

- [ ] New user without store subscription stays on Free tier
- [ ] Store trial unlocks features after verified purchase
- [ ] Trial banner shows days remaining
- [ ] Expired trial locks Pro features and shows paywall
- [ ] No Beta badge in header
- [ ] Paywall shows correct prices
- [ ] **Restore purchase** link works on native
- [ ] Web preview does not grant paid access
- [ ] `npm run test:billing` passes
- [ ] `npm run test:purchases` passes
- [ ] `npm run audit:copy` passes
- [ ] `/admin/launch-checklist` reviewed

## Internal commands

```bash
npm run test:billing
npm run test:purchases
npm run audit:copy
npm run build
npm run debug:plantpal
```

Launch checklist UI: `/admin/launch-checklist` (dev or founder mode)

## Environment variables (launch)

Production should **not** set:

- `DEV_UNLOCK_ALL_FEATURES`
- `NEXT_PUBLIC_DEV_UNLOCK_ALL_FEATURES`
- `NEXT_PUBLIC_BETA_UNLOCK_ALL` (legacy)

Optional dev only:

- `DEV_UNLOCK_ALL_FEATURES=true` (local development — enables mock tier in paywall)

## Remaining before submission

1. Set RevenueCat + EAS secrets and configure products in App Store Connect / Play Console
2. Run migration `034_subscription_store_fields.sql`
3. EAS dev client or production build (not Expo Go) for IAP testing
4. TestFlight + Play internal testing with sandbox purchases

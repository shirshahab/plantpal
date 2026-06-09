# PlantPal Billing Roadmap

Future payment integration and subscription infrastructure.  
**Current status:** mock tier in localStorage + preview upgrade flows — no Stripe, App Store, or Google Play yet.

---

## Phase 26 (shipped — framework)

- Official pricing: Free / Plus ($7.99 mo · $59 yr) / Family ($14.99 mo · $119 yr)
- `src/lib/billing/` — tiers, feature gates, beta override
- `/upgrade` — comparison table, monthly/annual toggle
- `/settings/subscription` — plan, usage, feature locks
- `user_subscriptions` table (schema ready, mock status)
- `BETA_UNLOCK_ALL` — beta testers get Plus-level access

---

## Stripe integration (planned)

### Checkout

1. Create Stripe Products + Prices matching official tiers (monthly + annual)
2. `POST /api/billing/checkout` — create Checkout Session with `client_reference_id` = user_id
3. Success/cancel URLs → `/settings/subscription?checkout=success`
4. Store `stripe_customer_id` on `profiles` or `user_subscriptions`

### Customer portal

- `POST /api/billing/portal` — Stripe Billing Portal for plan changes, payment method, invoices
- Link from Settings → Subscription (“Manage billing”)

### Webhooks

- `POST /api/billing/webhook` — verify signature, handle:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Update `user_subscriptions` tier, status, `starts_at`, `ends_at`

### Server-side enforcement

- Replace `loadMockSubscription()` with Supabase read in `SubscriptionProvider`
- API routes check tier before AI calls (doctor, care plan, concierge, landscape)
- Plant insert RLS or API guard for free tier limit

### Env vars (future)

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PLUS_MONTHLY=
STRIPE_PRICE_PLUS_ANNUAL=
STRIPE_PRICE_FAMILY_MONTHLY=
STRIPE_PRICE_FAMILY_ANNUAL=
```

---

## App Store subscriptions (iOS)

- Use **StoreKit 2** via React Native / Capacitor wrapper or native shell when PlantPal ships as iOS app
- Map App Store product IDs to internal tiers (`plus_monthly`, `family_annual`, etc.)
- **Server-side receipt validation** — never trust client-only tier
- Unified entitlement service: Stripe web + App Store → same `user_subscriptions` row
- Apple requires in-app purchase for digital subscriptions inside iOS apps (no external Stripe checkout link in app)

---

## Google Play subscriptions (Android)

- Play Billing Library 6+ with subscription base plans and offers
- Real-time developer notifications (RTDN) → webhook handler mirroring Stripe flow
- Same entitlement table; `source` column: `stripe | app_store | play_store`

---

## Trial strategy (planned)

| Tier | Suggested trial |
|------|-----------------|
| Plus | 7-day free trial (Stripe `trial_period_days`) |
| Family | 14-day free trial for household plans |

Rules:

- One trial per Apple/Google account and per Stripe customer
- `trial_ends_at` on `user_subscriptions`; downgrade to Free on expiry if no payment
- Beta period: `BETA_UNLOCK_ALL=true` supersedes trials (no card required)

---

## Referral discounts (planned)

- Referral codes table: `code`, `discount_percent`, `max_redemptions`, `expires_at`
- Stripe Promotion Codes or Coupons applied at Checkout
- In-app: “Invite a friend” → both get 1 month 50% off (example)
- Track `referred_by_user_id` on subscription for analytics

---

## Gift subscriptions (planned)

- Stripe Checkout `mode: payment` for fixed-term gift (12 months Plus)
- Gift code redemption flow → extends `ends_at` on recipient account
- Email delivery of redeem link (Resend / SendGrid)

---

## Sponsored / partner access (optional)

- Admin override tier for influencers, nursery partners
- `status = 'partner'` or `tier_override` column with expiry

---

## What stays mock until Stripe / stores

| Item | Today |
|------|--------|
| Payment processing | None |
| `user_subscriptions` writes | Client localStorage only |
| Upgrade CTAs | Set tier in preview mode |
| Webhooks | Not implemented |
| Receipt validation | Not implemented |
| Invoices / portal | Not implemented |

---

## Success metrics (future)

- Free → Plus conversion rate
- Annual vs monthly mix
- Feature gate impressions → upgrade clicks
- Plant #4 upgrade funnel completion
- Trial → paid retention (D7, D30)
- Churn by tier

---

*Last updated: Phase 26 framework.*

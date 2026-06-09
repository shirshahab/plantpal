# PlantPal Marketplace Plan

Future roadmap for shopping, affiliates, and local nursery integration.  
**Current status:** mock recommendations only — no affiliate links, no live product feeds.

---

## Vision

Make PlantPal useful **before** users buy plants, soil, fertilizer, pots, and tools. The Shop Assistant and Price Checker should evolve into a trusted pre-purchase layer that reduces buyer's remorse and supports local growers.

---

## Phase 25 (shipped — foundation)

- `/shop-assistant` — plant finder, buying guides, mock product catalog
- `/price-checker` — fair price estimates + links to marketplace
- `product_recommendations` table (schema ready)
- Mock product cards: name, category, best for, price range, why it fits, what to avoid

---

## Affiliate partnerships (planned)

### Home Depot affiliate

- Program: Home Depot Affiliate / Impact Radius (verify current program terms)
- Use cases: soil bags, drip kits, pruners, pots, pest control
- Implementation: `affiliate_url` on `product_recommendations`; UTM + disclosure badge on every outbound link
- Disclosure copy: *"PlantPal may earn a commission on qualifying purchases."*

### Amazon affiliate

- Program: Amazon Associates
- Use cases: bonsai tool sets, books, specialty fertilizers, indoor plant accessories
- Caveat: Amazon policy restricts certain plant categories in some regions — validate per SKU
- Prefer deep links to specific ASINs once catalog is curated

### Local nursery partnerships

- Geo-targeted "Buy near you" module using ZIP + optional map
- Nursery dashboard (future): claim listing, upload inventory highlights, sponsor featured slots
- No commission initially — value exchange via referrals and PlantPal Pro nursery tier

---

## Brand partnerships (soil & fertilizer)

Target brands for curated guides (not endorsements until formal deals):

| Category | Example brands |
|----------|----------------|
| Citrus / avocado soil | Kellogg, E.B. Stone, FoxFarm |
| Organic fertilizer | Dr. Earth, Down to Earth, Espoma |
| Bonsai supplies | Bonsai Empire, Tinyroots (affiliate or wholesale) |

Structure: co-branded buying guides (`Best soil for citrus — editor's pick`) with optional sponsored badge.

---

## Sponsored listings

- **Featured product** slot at top of category browse (clearly labeled "Sponsored")
- **Guide sponsorship** — one product highlighted inside a buying guide
- Frequency cap: max 1 sponsored item per guide, max 2 per category page
- Pricing model TBD (CPM vs CPA vs flat monthly for nurseries)

---

## User-submitted prices

Extend Price Checker community data:

1. **`price_reports` table** (future) — store, city, plant, size, price, photo optional, user_id
2. Moderation queue for outliers and spam
3. Aggregate into regional fair-price ranges (replace static mock tiers)
4. Gamification: badge for contributors ("Local price scout")

Already stubbed in Price Checker UI — "Report a Price" form shows toast only.

---

## Data model alignment

### `product_recommendations` (live schema)

| Field | Mock today | Future |
|-------|------------|--------|
| `name` | ✅ | Sync from catalog or CMS |
| `category` | ✅ | Filter + SEO landing pages |
| `description` | ✅ (in mock as separate fields) | Single description column |
| `best_for` | ✅ | |
| `price_range` | ✅ | Live scrape or affiliate API |
| `affiliate_url` | null | Populated when programs active |
| `image_url` | optional mock | CDN or partner feed |

Consider adding later: `why_it_fits`, `what_to_avoid`, `updated_at`, `is_sponsored`, `region_tags[]`.

---

## Technical next steps

1. Seed `product_recommendations` from `MOCK_PRODUCTS` via admin script or Supabase seed
2. API route `GET /api/marketplace/products?category=` reading from DB with mock fallback
3. Affiliate link wrapper `/go/:productId` for click tracking
4. FTC-compliant disclosure component (global footer on marketplace pages)
5. Price report persistence → aggregate engine
6. A/B test Shop Assistant tabs vs single scroll page

---

## What stays mock until partnerships

- All product cards and affiliate URLs
- Sponsored slots
- Live regional inventory
- User price report storage
- Nursery "Buy near you" map

---

## Success metrics (future)

- Shop Assistant → Price Checker conversion
- Guide views → product card clicks
- Affiliate click-through rate (when live)
- Price reports submitted per metro
- Reduction in "bad buy" feedback in beta surveys

---

*Last updated: Phase 25 foundation.*

# PlantPal — Official Brand Foundation

> **Full brand book:** See [`BRAND_BOOK.md`](./BRAND_BOOK.md) for the complete source of truth (identity, Planty, app features, website, pricing, and checklists). This file is the quick reference.

## Brand Name

**PlantPal** — simple, friendly, memorable, easy to spell and recommend.

---

## Tagline

**Grow with confidence.**

Usage:

```
PlantPal
Grow with confidence.
```

---

## Positioning

PlantPal is the smart plant care coach that helps homeowners, gardeners, and plant enthusiasts track, diagnose, and care for every plant they own using local climate intelligence, AI guidance, and personalized growing goals.

---

## What PlantPal Is

**Not:** a plant encyclopedia, watering reminder app, identification app, or gardening database.

**Is:** The smart plant care coach. PlantPal helps users know exactly what to do next.

---

## Mission

Help every homeowner, gardener, and plant parent grow healthier plants through simple, local, personalized guidance.

---

## Vision

Become the operating system for plant ownership — every plant with a digital twin, health profile, growth history, personalized care plan, local climate strategy, and goal-based roadmap.

---

## Brand Promise

PlantPal gives plant owners **confidence** — not more information, not more complexity.

---

## Personality

**Feel:** Calm, smart, helpful, trustworthy, friendly, optimistic, nature-first.

**Avoid:** Corporate, overly scientific, cold, AI buzzword-heavy, generic gardening store.

**References:** Apple + Patagonia + Headspace

---

## Typography

| Role | Font | Weights |
|------|------|---------|
| Headings | Plus Jakarta Sans | SemiBold (600), Bold (700) |
| Body / UI | Inter | Regular (400), Medium (500) |

CSS: `.font-heading` for headlines. Body uses Inter via `--font-inter`.

---

## Color System

| Token | Hex | Use |
|-------|-----|-----|
| Primary (Deep Botanical Green) | `#2D6A4F` | Buttons, logo, links, nav |
| Sage Green | `#95B89B` | Cards, borders, accents |
| Growth Green | `#74C365` | Success, progress, highlights |
| Background | `#FAFBF8` | App & website background |
| Primary Text | `#1F2937` | Headlines, body |
| Secondary Text | `#6B7280` | Descriptions, metadata |

Tailwind: `brand-primary`, `brand-sage`, `brand-growth`, `brand-bg`, `brand-text`, `brand-text-secondary`

Code reference: `src/lib/brand/tokens.ts`

---

## Logo — The Living P (official asset)

The official logo is a **PNG squircle** — white Living P (stem + leaf bowl + vein) on green.

**Always use the official file.** Do not recreate the mark in SVG or Lucide icons.

| Asset | Path |
|-------|------|
| App icon / favicon source | `public/app-icon.png` |
| Next.js favicon (auto) | `src/app/icon.png` |
| Apple touch icon | `src/app/apple-icon.png` |
| Code constant | `OFFICIAL_APP_ICON` in `src/lib/brand/tokens.ts` |
| React component | `PlantPalIconTile` / `PlantPalLogo` in `src/components/brand/plantpal-logo.tsx` |

Minimal, geometric, scalable. No cartoon plants, gradients, or generic leaf substitutes.

---

## Messaging

### Hero

- **Headline:** Because plants don't come with instructions.
- **Subheadline:** Track every plant, diagnose problems with photos, get local care advice, and know exactly what to do next.
- **Primary CTA:** Start Growing
- **Secondary CTA:** Explore Demo

### One-liner

PlantPal helps you track every plant, diagnose problems with photos, and get personalized care advice based on where you live.

### App Store

PlantPal is your smart plant care coach. Track every plant you own, diagnose problems with photos, get personalized care plans, receive local climate intelligence, and know exactly what to do each day. Whether you're growing houseplants, fruit trees, bonsai, vegetables, or a full backyard garden, PlantPal helps you grow with confidence.

---

## Implementation

| Asset | Location |
|-------|----------|
| Brand tokens | `src/lib/brand/tokens.ts` |
| Logo component | `src/components/brand/plantpal-logo.tsx` |
| Global styles | `src/app/globals.css` |
| Fonts | `src/app/layout.tsx` |
| Marketing site | `src/app/(marketing)/` |

# Portfolio

A personal portfolio site built as an editorial publication — paper, ink, serif headlines, mono captions. Seven sections rendered with seven distinct rhythms so the reader knows where they are by typography alone: hero masthead, dossier case files, ledger of open-source artifacts, atlas of capabilities, lead/follow ventures pair, dated articles feed, terminal contact beat.

[![Built with Next.js](https://img.shields.io/badge/Built_with-Next.js_16-000.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](https://www.typescriptlang.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com)

## Stack

- **Next.js 16** (App Router, static export — every page prerenders to HTML)
- **TypeScript** strict
- **Tailwind CSS v4** with custom `@theme` tokens (no default spacing/color escape hatches)
- **Fraunces** (serif display + body) and **JetBrains Mono** (captions, datelines, code) via `next/font`
- **lucide-react** for the two icons in the theme toggle
- **Playwright** (dev-only) for visual verification — not shipped

Zero runtime JavaScript dependencies beyond React. No analytics, no third-party trackers, no `fetch` to any external service at runtime.

## Design system

A small set of tokens defined in `app/globals.css` under `@theme`. Everything in the UI composes from these:

- **Palette**: paper / paper-deep / ink / ink-soft / ink-mute / rule / accent — seven names. Light is the default; dark overrides under `[data-theme="dark"]`. Same markup, theme swaps via CSS custom properties. All ink tiers are AA-contrast against both backgrounds (light ink-mute = 5.47:1 vs paper, 5.00:1 vs paper-deep).
- **Type**: caption 11px / body-sm 14px / body 17px / lede 21px / h2 36px / sub-display 56px / display 80px. Serif for voice, mono for data.
- **Spacing**: `1u 2u 3u 5u 8u 12u 18u` (8px base, editorial-grammar steps). Any other `Nu` value is **not declared** and Tailwind drops it silently — components stay strictly on the declared scale.
- **Accent**: oxblood (`#7b2a1f` light) / steel-cyan (`#6b8a96` dark). Reserved for hover and one marginal mark per section — never as a CTA fill.

## Architecture

```
app/
├── layout.tsx          ← pre-paint theme boot script, fonts, global mounts
├── page.tsx            ← assembles the 7 sections in order
└── globals.css         ← @theme tokens + view-transitions CSS + inner-scroll styles

components/
├── theme-toggle.tsx        ← client island, View Transitions API circular reveal
├── section-rail.tsx        ← client island, IntersectionObserver scroll-spy
└── sections/
    ├── selected-work.tsx       (server)
    ├── open-source.tsx         (server)
    ├── capabilities.tsx        (server)
    ├── ventures.tsx            (server)
    ├── articles.tsx            (server, inner-scroll)
    └── contact.tsx             (server)

lib/
├── content/portfolio-data.ts   ← single source of truth, typed
└── utils.ts                    ← cn + shared isPlaceholder gate

scripts/
├── og-probe.mjs                ← throwaway diagnostic for X.com OG metadata
└── fetch-article.mjs           ← manual dev tool: fetch X articles → paste-ready records
```

**The app and the build never contact X (or any external service).** All data is static, committed to `portfolio-data.ts`. Articles are populated by running `scripts/fetch-article.mjs` locally and pasting the output into the data file. See [Scripts](#scripts) below.

## Editorial conventions

- **Placeholders**: any field whose value isn't ready ships as `"TODO: confirm"`. The `isPlaceholder()` helper in `lib/utils.ts` gates rendering — placeholder strings never reach the DOM. Replacing the value with real content makes the gated UI appear with zero code change.
- **Seven distinct section rhythms** so the reader can tell where they are by typography alone: hero masthead, asymmetric dossier rows (Selected Work), tight horizontal ledger (Open Source), 2×2 atlas of equal-weight blocks (Capabilities), lead/follow side-by-side pair (Ventures), dated feed with inner scroll (Articles), terminal statement + email + footer (Contact).
- **Two pieces of fixed furniture**: theme toggle (top-right) and section navigation rail (left-edge, desktop only). They occupy opposite corners and never collide.
- **Smooth scroll is native CSS** (`scroll-behavior: smooth`, gated to `prefers-reduced-motion: no-preference`). No JS smooth-scroll library — Lenis was tried and removed.
- **One mounted animation**: an opacity-only `editorial-rise` on `main`. Plus the View Transitions API circular reveal on theme flip. That's it; the design is type-driven, not motion-driven.

## Local dev

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # full static build to .next/server/app/
npm run start    # serves the production build
```

Requires Node 18.17+ (Next 16 requirement).

## Scripts

```bash
# One-off: fetch a single X article and print a paste-ready record
node scripts/fetch-article.mjs https://x.com/<handle>/status/<id>

# Batch: process scripts/article-url.txt (one URL per line)
node scripts/fetch-article.mjs

# Tunable for tiny re-runs (X soft-throttles bursts of crawler-UA fetches):
BASE_DELAY_MS=3000 node scripts/fetch-article.mjs <url1> <url2>
```

The fetch script uses `User-Agent: Twitterbot/1.0` (X serves a small SSR stub to crawler UAs; a normal browser UA gets a 270 KB JS shell with no metadata). The **real article title sits in `og:description`** for X status URLs (`og:title` is the author profile — the script ignores it). See `scripts/og-probe.mjs` for the diagnostic that surfaced this.

## Accessibility

- All text tiers pass WCAG AA against both light and dark backgrounds.
- Theme toggle has `aria-label` reflecting next-state and respects `prefers-reduced-motion` (instant flip when reduced; circular reveal otherwise).
- Section rail uses real `<a href="#id">` anchors — keyboard, back-button, and open-in-new-tab all work natively.
- Inner-scroll containers expose `tabIndex={0}` + `aria-label` so keyboard users can focus and arrow-scroll the list.
- External links carry `rel="noopener noreferrer"`.
- No motion beyond `editorial-rise` (opacity-only) and the optional View Transitions reveal — both gated on reduced-motion.

## Deployment

Static. Build produces fully-prerendered HTML in `.next/server/app/`. Deploy anywhere that serves static files (Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront, a $5 VPS).

## License

All rights reserved. Code and content not licensed for redistribution. (Open an issue if you'd like to use a pattern from here — happy to discuss.)

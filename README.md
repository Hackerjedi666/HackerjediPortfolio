# Portfolio

A personal portfolio site — editorial-publication composition fused with offensive-security iconography. Dark-only, near-OLED black with warm bone ink, serif body voice and mono station labels. Six sections, each rendered with a distinct rhythm so the reader knows where they are by typography alone: hero masthead with pinned scroll-decode, dossier case files, ledger of open-source artifacts, 2×2 atlas of capabilities, lead/follow ventures pair, dated articles feed, terminal contact beat. Plus a hidden ROOT MODE that flips the entire palette to matrix green-on-black.

[![Built with Next.js](https://img.shields.io/badge/Built_with-Next.js_16-000.svg)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-149eca.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](https://www.typescriptlang.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com)

## Stack

**Runtime**

- **Next.js 16.2** (App Router, RSC, statically prerendered)
- **React 19.2**
- **TypeScript 5** in strict mode
- **Tailwind CSS v4** with custom `@theme` tokens (no default spacing/color escape hatches)

**Motion + graphics**

- **GSAP 3.15** + **ScrollTrigger** — the pinned hero timeline, scrubbed scramble-decodes, per-section scroll-tied entries
- **Lenis 1.3** — virtualized smooth scroll, bridged to GSAP ticker so a single rAF drives both
- **OGL 1.0** — full-viewport WebGL noise-field background shader; cursor magnetism + slow color drift
- **three.js 0.184** — wireframe icosahedron in the hero right band (cryptographic seal)
- **View Transitions** — used by the ROOT MODE flip's circular reveal *(reserved for re-enable)*

**Typography**

- **Fraunces** — optical-sized serif, display + body voice
- **JetBrains Mono** — captions, datelines, station labels, terminal text

Both loaded via `next/font` (self-hosted, zero runtime CSS request).

**Icons**

- **lucide-react** — Terminal icon for the ROOT MODE toggle

**Dev only**

- **ESLint 9** (Next presets)
- **Playwright** — visual verification during dev. Not shipped, not in `dependencies`.

No analytics, no third-party trackers, no runtime `fetch` to any external service. All content is statically committed to `lib/content/portfolio-data.ts`.

## Design system

A small set of tokens defined in `app/globals.css` under `@theme`. Sections compose strictly from these — anything outside the scale is silently dropped by Tailwind v4.

- **Palette (dark, the only mode):** `paper #030307` / `paper-deep #0a0b0f` / `ink #e8e4d8` (warm bone) / `ink-soft #a8a59c` / `ink-mute #888579` / `rule #2e3037` / `accent #6b8a96` (steel-cyan, status-LED). No pure black, no pure white, no neon. All ink tiers pass WCAG AA against both surfaces.
- **ROOT MODE override** (`:root.root-mode`): `paper #050505` / `ink #33ff00` / `accent #33ff00`. Mono body font. Toggled by the Terminal button (top-right) or by typing the Konami code (`↑↑↓↓←→←→BA`).
- **Type scale:** caption 11px / body-sm 14px / body 17px / lede 21px / h2 36px / sub-display 56px / display 80px. Serif for voice, mono for data.
- **Spacing:** `1u 2u 3u 5u 8u 12u 18u` (8px base, editorial-grammar steps). Any other `Nu` value is **not declared** and Tailwind drops it silently.

## Hero — pinned scroll-decoded reveal

The hero (`<article id="top">`) is pinned to the viewport for ~180vh of scroll. As the user scrolls, GSAP scrubs a single timeline:

1. **Intro overlay** (`> whoami` / `abhimanyu_gupta`) — types in at mount on a paper-opaque overlay, lifts + blurs + scramble-decays out between timeline 0.3–0.7.
2. **Masthead** — each word rises from `y:80, scale:0.92` while scramble-decoding from `!<>-_\\/[]{}=+*^?#$%&0123456789ABCDEF` chars into its final form. Staggered word-by-word at 0.18s intervals from timeline 0.5.
3. **Lede** — rises into place at timeline 1.3.
4. **Signature footer** — rises at timeline 1.7.
5. **Pin releases** — page continues into Selected Work.

A full-viewport OGL fragment shader paints a slow noise field mixing `--color-paper` and `--color-paper-deep` behind it all; the cursor pulls the field toward itself and tints it with `--color-accent`. A Three.js wireframe icosahedron sits in the hero right band (the editorial portrait slot) and tilts to follow the pointer. Both observe `<html>` class changes so ROOT MODE re-tints them live.

## Architecture

```
app/
├── layout.tsx          ← fonts, global client mounts (no theme boot — dark only)
├── page.tsx            ← assembles 6 sections + intro overlay + crypto-object
└── globals.css         ← @theme tokens + base + root-mode + intrusion-log + cursor-hex-trail

components/
├── motion-provider.tsx       ← Lenis + GSAP-ticker bridge + ScrollTrigger registration
├── motion-choreography.tsx   ← all GSAP timelines (hero pin, per-section entries)
├── hero-canvas.tsx           ← OGL fragment-shader noise field, cursor magnetism, root-mode-reactive
├── crypto-object.tsx         ← Three.js wireframe icosahedron, pointer-tilt, root-mode-reactive
├── cursor.tsx                ← custom ring/dot cursor + hex-character trail
├── scroll-progress.tsx       ← top-edge hairline scroll indicator
├── section-rail.tsx          ← left-edge anchor rail, IntersectionObserver scroll-spy
├── root-mode.tsx             ← Konami code listener → toggles html.root-mode
├── root-mode-toggle.tsx      ← top-right Terminal button, MutationObserver-synced
├── intrusion-log.tsx         ← synthetic offensive-sec telemetry strip
├── type-out.tsx              ← typewriter primitive (IntersectionObserver-triggered)
├── scramble-text.tsx         ← decode-into-place primitive
├── redacted.tsx              ← horizontal sweep reveal primitive
└── sections/
    ├── selected-work.tsx     (server, asymmetric dossier rows)
    ├── open-source.tsx       (server, tight horizontal ledger)
    ├── capabilities.tsx      (server, 2×2 atlas of equal-weight blocks)
    ├── ventures.tsx          (server, lead/follow side-by-side pair)
    ├── articles.tsx          (server, dated feed with inner scroll)
    └── contact.tsx           (server, terminal statement + email + footer)

lib/
├── motion.ts                 ← Lenis singleton + reduced-motion accessor
├── utils.ts                  ← cn() + isPlaceholder() gate
└── content/portfolio-data.ts ← single source of truth, typed

scripts/
├── fetch-article.mjs         ← manual dev tool: fetch X articles → paste-ready records
├── og-probe.mjs              ← diagnostic for X.com OG metadata
└── article-url.txt           ← input list for batch fetch-article runs
```

**The app and the build never contact X (or any external service).** Articles are populated by running `scripts/fetch-article.mjs` locally and pasting the output into the data file.

## Reactive subsystems

Both WebGL surfaces watch `<html>` class for live ROOT MODE re-tint:

- `hero-canvas.tsx` — MutationObserver on `class` re-reads CSS custom properties; shader uniforms lerp toward the new colors so the flip drifts under the change rather than snapping.
- `crypto-object.tsx` — same observer; Three.js line + point materials snap to the new ink/accent.

The custom cursor (`cursor.tsx`) is mounted globally but bails on `pointer: coarse` or `prefers-reduced-motion`. It listens to `pointermove` + `pointerenter/leave` and detects interactive targets (`a, button, [role="button"], [data-cursor-grow], input, textarea, select, summary`) to enter a magnetize state.

## Editorial conventions

- **Placeholders:** any field whose value isn't ready ships as `"TODO: confirm"`. The `isPlaceholder()` helper gates rendering — placeholder strings never reach the DOM.
- **Six distinct section rhythms** so the reader can tell where they are by typography alone.
- **Two pieces of fixed furniture:** ROOT MODE toggle (top-right) and section navigation rail (left-edge, desktop only).
- **Smooth scroll:** Lenis-driven, bridged via the GSAP ticker so there's never two competing rAF loops. Reduced-motion path skips Lenis entirely and falls through to native scroll.
- **One ease character:** expo-out (`1.001 - 2^(-10t)`). Lenis, GSAP entries, the intro decay — all share the same decelerate curve.

## Local dev

```bash
npm install
npm run dev      # http://localhost:3000 (Turbopack)
npm run build    # full prerender to .next/server/app/
npm run start    # serves the production build
npm run lint
```

Requires Node 18.17+ (Next 16 requirement). The dev server listens on `0.0.0.0:3000` so iPhones/iPads on the same LAN can hit `http://<your-ip>:3000` — add your machine's LAN IP to `allowedDevOrigins` in `next.config.ts`.

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

- All text tiers pass WCAG AA against the dark surfaces (ink-mute 5.0:1+).
- ROOT MODE toggle has `aria-label` reflecting next-state, `aria-pressed` synced via MutationObserver, and `title` for hover.
- Konami code listener stays passive — does not interfere with form input or scroll.
- Section rail uses real `<a href="#id">` anchors — keyboard, back-button, and open-in-new-tab all work natively. Lenis intercepts the click and routes it through its smooth `scrollTo`.
- Inner-scroll containers (Articles) expose `tabIndex={0}` + `aria-label` so keyboard users can focus and arrow-scroll the list.
- External links carry `rel="noopener noreferrer"`.
- **Reduced-motion path is comprehensive:** Lenis is not instantiated, the GSAP choreography bails on mount, the hero intro overlay is hidden via CSS (`display: none`), the cursor returns null, the OGL canvas returns null, the cursor hex-trail is hidden via CSS. The page collapses to a clean static editorial layout with native scroll.

## Easter eggs

- **Konami code** (`↑↑↓↓←→←→BA`) toggles ROOT MODE — full palette flip to matrix green on OLED black, mono body font.
- **Terminal button** (top-right, next to nothing else) does the same thing.
- **Cursor hex trail** — small mono hex chars (`0–9 A–F`) spawn in the cursor's wake and drift up while fading out. Gated on `pointer: fine` and `prefers-reduced-motion: no-preference`.
- **Intrusion log** — synthetic offensive-sec telemetry lines stream into a corner strip; pure decoration.

## Deployment

Statically prerendered. Build produces fully-prerendered HTML + a small client bundle (GSAP + Lenis + OGL + three.js + React) in `.next/server/app/`. Deploy anywhere that serves static files (Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront, a $5 VPS).

## License

All rights reserved. Code and content not licensed for redistribution. (Open an issue if you'd like to use a pattern from here — happy to discuss.)

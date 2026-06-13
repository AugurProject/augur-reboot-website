---
title: Technical Architecture
tags: [architecture, astro, react, components]
---

# Technical Architecture

This document describes the Astro/React implementation of the Augur Fork Meter site, including component architecture, state management, and UI patterns.

## Architecture Overview

The site is built with:
- **Astro 5.10+** for static site generation with islands architecture
- **React 19** for interactive client-side components (hydrated islands)
- **Tailwind CSS v4** (CSS-first configuration via `@theme`/`@utility` directives)
- **React Context** for island-scoped fork monitor state
- **SVG** for gauge visualization
- **MDX** for blog and learn content collections

## Component Hierarchy

```
Layout.astro (Base HTML shell — toggles html.boot class for CSS-driven intro)
├── PageHeader.tsx / Footer.astro (navigation chrome)
├── Pages
│   ├── index.astro (Homepage)
│   │   ├── Intro.tsx (client:load — CRT boot overlay, removes html.boot on complete)
│   │   ├── HeroBanner.tsx (client:load — CSS-animated entrance via .hero-* classes)
│   │   │   ├── PerspectiveGridTunnel.tsx (client:load)
│   │   │   ├── PageHeader.tsx (social links + back nav)
│   │   │   └── ForkMonitor.tsx (client:load — Fork Gauge island)
│   │   │       ├── ForkDataProvider.tsx (data fetching)
│   │   │       ├── ForkGauge.tsx (SVG visualization)
│   │   │       ├── ForkStats.tsx (progressive disclosure)
│   │   │       ├── ForkDisplay.tsx (layout)
│   │   │       ├── ForkDetailsCard.tsx (dialog with expanded metrics + ForkAsciiArt)
│   │   │       └── ForkControls.tsx (demo mode, F2 toggle)
│   │   └── FeaturedBlogs.astro
│   │       └── BlogPostCard.astro
│   ├── blog/index.astro → BlogPostCard.astro
│   ├── blog/[...slug].astro → BlogLayout.astro
│   │   ├── BlogPostMeta.astro
│   │   ├── BlogNavigation.tsx (client:load)
│   │   ├── BlogCTA.tsx (client:load)
│   │   └── SocialShareButtons.astro
│   ├── learn/[...slug].astro → LearnLayout.astro or MigrationGuideLayout.astro
│   │   ├── ProseCard.astro
│   │   ├── MigrationCta.tsx (fork/migration CTA block)
│   │   └── LearnNavigation.tsx (client:load)
│   ├── mission.astro → TimelineSection.astro
│   └── team.astro → TeamCard.astro
```

## State Management

### CSS-Driven Animation (Landing Page)
The hero/intro animation sequence is CSS-driven — no JavaScript state machine. A synchronous `<script is:inline>` in **Layout.astro** toggles `html.boot` based on:
- Whether the current page is the landing page (`pathname === basePath`)
- `sessionStorage.getItem('skipIntro')` (set after first boot or skip)
- `prefers-reduced-motion` media query

When `.boot` is present, the CRT overlay (`#crt-overlay`) is shown and all hero entrance animations are suppressed via `html.boot .hero-* { animation: none; opacity: 0 }`. When **Intro.tsx** completes (or skip is pressed), it removes `.boot`, which triggers all CSS `animation` declarations from delay 0.

### React Context (Island-scoped)
- `ForkDataProvider.tsx` — provides fork risk data to the gauge island
- `ForkMockProvider.tsx` — demo mode data override

### Data Flow

`ForkDataProvider` fetches `/data/fork-risk.json` for the gauge island and refreshes it on an interval. `ForkMockProvider` wraps the same island for development-only demo scenarios.

The monitor's calculation and CI data pipeline are intentionally documented outside this architecture page:

- [[fork-monitoring-methodology]] — calculation method and risk signal
- [[fork-monitoring-pipeline]] — GitHub Actions pipeline and artifact flow

## Content Collections

Defined in `src/content/config.ts`:
- **blog** — MDX posts with frontmatter (title, date, excerpt, tags, etc.)
- **learn** — Educational MDX articles

See [[blog-feature]] for content structure details.

## Styling System

### Tailwind v4 CSS-First
All theme tokens are defined via `@theme` in `src/styles/global.css`. No `tailwind.config.js`.

### Custom Properties
Risk level colors for ForkGauge:
```css
--color-green-400   /* LOW risk */
--color-green-500   /* Gauge gradient stop */
--color-yellow-400  /* MODERATE risk */
--color-orange-400  /* HIGH risk */
--color-red-500     /* CRITICAL risk */
```

### Custom Utilities
- `fx-glow` / `fx-glow-*` — drop-shadow glow effects
- `fx-box-glow` / `fx-box-glow-*` — box-shadow glow effects
- `fx-pulse-glow` — animated pulsing glow

### Typography
- **Display/UI**: Handjet (narrow console font)
- **Prose/Body**: IBM Plex Mono (monospace)
- **Headings**: Oxanium (geometric sans)

## File Structure

```
src/
├── assets/           # Bundled images (migration step screenshots)
├── components/       # Astro + React components
├── content/          # MDX content collections (blog, learn)
├── layouts/          # Layout.astro, BlogLayout.astro, LearnLayout.astro, MigrationGuideLayout.astro
├── lib/              # Shared utilities
├── pages/            # Astro file-based routing
├── providers/        # React context providers
├── styles/           # global.css (single source of truth for theme)
├── types/            # TypeScript type definitions
└── utils/            # Helper functions
scripts/              # Node.js scripts (fork monitor calculation)
docs/                 # Project documentation
public/               # Static assets (fonts, images, data)
```

## Key Implementation Details

### Islands Architecture
Interactive components use `client:load` for immediate hydration. Static content (layouts, navigation chrome, blog cards) renders as pure Astro with zero JS.

### Fork Gauge Visual Scaling
Linear mapping — round progress maps directly to gauge fill:
- 0% round progress → 0% gauge fill
- 50% round progress → 50% gauge fill
- 100% round progress → 100% gauge fill

No non-linear stretching. The gauge is a straightforward half-circle arc where fill equals the round progress percentage.

### Progressive Disclosure
- **No disputes**: "System steady — No market disputes"
- **Active disputes**: Est. time to fork, dispute bond (approximate), dispute round (current/~estimated), market title + address
- **Unknown projection**: When round projection is unavailable, shows "PROJECTION UNAVAILABLE"

### Risk Calculation

See [[fork-monitoring-methodology]]. This page tracks UI architecture only; calculation details live with the monitor methodology to avoid duplicate drift.

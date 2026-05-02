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
- **Nanostores** for global reactive state
- **SVG** for gauge visualization
- **MDX** for blog and learn content collections

## Component Hierarchy

```
Layout.astro (Base HTML shell)
├── Header / Footer / SocialLinks (Astro components)
├── Pages
│   ├── index.astro (Homepage)
│   │   ├── HeroBanner.astro
│   │   │   ├── PerspectiveGridTunnel.tsx (client:load)
│   │   │   ├── Typewriter.tsx / TypewriterSequence.tsx (client:load)
│   │   │   └── ScrollIndicator.tsx (client:load)
│   │   ├── ForkMonitor.tsx (client:load — Fork Gauge island)
│   │   │   ├── ForkDataProvider.tsx (data fetching)
│   │   │   ├── ForkGauge.tsx (SVG visualization)
│   │   │   ├── ForkStats.tsx (progressive disclosure)
│   │   │   ├── ForkDisplay.tsx (layout)
│   │   │   ├── ForkControls.tsx (demo mode)
│   │   │   └── ForkDetailsCard.tsx (expanded metrics)
│   │   ├── Intro.tsx (client:load)
│   │   └── FeaturedBlogs.astro
│   │       └── BlogPostCard.astro
│   ├── blog/index.astro → BlogPostCard.astro
│   ├── blog/[...slug].astro → BlogLayout.astro
│   │   ├── BlogPostMeta.astro
│   │   ├── BlogNavigation.tsx (client:load)
│   │   ├── BlogCTA.tsx (client:load)
│   │   └── SocialShareButtons.astro
│   ├── learn/[...slug].astro → LearnLayout.astro
│   │   ├── ProseCard.astro
│   │   └── LearnNavigation.tsx (client:load)
│   ├── mission.astro → TimelineSection.astro
│   └── team.astro → TeamCard.astro
```

## State Management

### Nanostores (Global State)
- `animationStore.ts` — tracks hero animation state across components

### React Context (Island-scoped)
- `ForkDataProvider.tsx` — provides fork risk data to the gauge island
- `ForkMockProvider.tsx` — demo mode data override

### Data Flow
1. `ForkDataProvider` fetches `/data/fork-risk.json` on mount
2. Primary gauge signal: `roundProgress` (current round / estimated total rounds × 100)
3. Bond/threshold percentage still computed and stored, but used only for informational display
4. Auto-refresh every 5 minutes
5. `ForkMockProvider` wraps for demo scenarios

**Data Source:** `fork-risk.json` is generated hourly by GitHub Actions. See [[fork-monitoring-pipeline]] for the monitoring workflow.

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
--color-red-500     /* ELEVATED risk */
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
├── components/       # Astro + React components
├── content/          # MDX content collections (blog, learn)
├── layouts/          # Layout.astro, BlogLayout.astro, LearnLayout.astro
├── lib/              # Shared utilities
├── pages/            # Astro file-based routing
├── providers/        # React context providers
├── stores/           # Nanostores
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
- **Active disputes**: Dispute bond, threshold %, dispute round
- **Demo mode**: Additional controls and current values

### Risk Calculation
```typescript
const roundProgress = (currentRound / estimatedTotalRounds) * 100
```
Where `currentRound` is the highest non-zero participant index and `estimatedTotalRounds` is projected from the bond growth trajectory. See [[fork-monitoring-methodology]] for the full calculation.

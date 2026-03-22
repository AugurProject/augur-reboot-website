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
2. Single metric: largest active dispute bond / 275,000 REP
3. Auto-refresh every 5 minutes
4. `ForkMockProvider` wraps for demo scenarios

**Data Source:** `fork-risk.json` is generated hourly by GitHub Actions. See `docs/fork-risk-monitoring-system.md` for the monitoring workflow.

## Content Collections

Defined in `src/content/config.ts`:
- **blog** — MDX posts with frontmatter (title, date, excerpt, tags, etc.)
- **learn** — Educational MDX articles

See `docs/blog-feature.md` for content structure details.

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
scripts/              # Node.js scripts (fork risk calculation)
docs/                 # Project documentation
public/               # Static assets (fonts, images, data)
```

## Key Implementation Details

### Islands Architecture
Interactive components use `client:load` for immediate hydration. Static content (layouts, navigation chrome, blog cards) renders as pure Astro with zero JS.

### Fork Gauge Visual Scaling
Non-linear mapping for intuitive display:
- 0% actual → 0% gauge fill
- 5% actual → ~25% gauge fill
- 25% actual → ~50% gauge fill
- 75% actual → ~90% gauge fill

### Progressive Disclosure
- **No disputes**: "System steady — No market disputes"
- **Active disputes**: Dispute bond, threshold %, dispute round
- **Demo mode**: Additional controls and current values

### Risk Calculation
```typescript
const forkThresholdPercent = (largestActiveDisputeBond / 275000) * 100
if (forkThresholdPercent < 10) return 'LOW'
if (forkThresholdPercent < 25) return 'MODERATE'
if (forkThresholdPercent < 75) return 'HIGH'
return 'ELEVATED'
```

Uses actual contributed amounts from `DisputeCrowdsourcerContribution` events.

# Augur Website Project Overview

## Quick Reference

**Project**: Astro-based website for the Augur prediction market reboot
**Repo**: @lituus/augur-website (main branch auto-deploys to https://augur.net)
**Stack**: Astro 5.10+ | React 19 | Tailwind CSS 4.1 | GitHub Pages (production)
**Dev Server**: localhost:4321 (Cloudflare adapter for local SSR)

## Core Features

### 1. Retro-Futuristic Landing Page
- CRT monitor simulation with power-on/off animations
- Perspective grid tunnel background (3D WebGL)
- Typewriter terminal-style intro sequence
- Animated content with smooth transitions

### 2. Fork Risk Monitoring System
**NEW**: Real-time visualization of Augur v2 protocol fork risk

- **Data Source**: Ethereum blockchain event monitoring
- **Visualization**: SVG-based animated gauge (0-100%)
- **Update Frequency**: 5-minute auto-refresh (hourly calculation via GitHub Actions)
- **Demo Mode**: `F2` key toggles dev scenarios (production-safe)
- **Components**: ForkMonitor, ForkGauge, ForkStats, ForkDisplay, ForkBadge

### 3. Technical Mission Page
- Protocol specifications and roadmap
- Detailed risk metrics and methodology
- Educational content about Augur v2

## Project Structure

```
src/
├── styles/global.css           # Tailwind v4 with @theme/@utility directives
├── components/
│   ├── Core UI: Intro, CrtDisplay, PerspectiveGridTunnel, HeroBanner
│   ├── Fork Risk: ForkMonitor, ForkGauge, ForkStats, ForkDisplay, ForkControls, ForkBadge
│   └── Data: ForkDataProvider, ForkMockProvider
├── providers/                  # React Context providers
├── scripts/                    # Node.js blockchain scripts
│   └── calculate-fork-risk.ts  # Ethereum RPC interaction with failover
├── stores/                     # Nanostores state management
├── assets/                     # Static resources (SVGs, images)
├── lib/                        # Shared utilities
└── pages/                      # Route definitions (index.astro, mission.astro)
```

## Critical Architectural Rules

**DO NOT break these:**

1. **Server vs Client**: State in stores, rendering components are reactive only
2. **No URL Logic in Components**: Page initialization happens in store initialization
3. **GitHub Pages Deployment**: Production is static, NOT Cloudflare
4. **Styling**: Use `src/styles/global.css` with Tailwind v4 `@theme/@utility` directives
5. **WebGL Cleanup**: Call dispose() in React cleanup effects to prevent GPU memory leaks

## Development Workflow

### Before Changes
```bash
# 1. Check dev server running
lsof -ti:4321

# 2. Verify Tailwind compilation
npm run dev

# 3. Type checking (project references for dual runtime)
npm run typecheck
```

### Key Commands
- **Development**: `npm run dev` (localhost:4321)
- **Production Build**: `npm run build` (static output)
- **Fork Risk Data**: `npm run build:fork-data` (requires Node.js 22+)
- **Type Check**: `npm run typecheck`
- **Lint**: `npm run lint` (Biome with tabs + single quotes)

### Testing Fork Risk System
```bash
# Calculate fresh data locally
npm run build:fork-data

# Check RPC info
cat public/data/fork-risk.json | jq '.rpcInfo'

# Enable demo mode: Press F2 in browser dev mode
```

## Fork Risk Data Flow

1. **Input**: Ethereum Augur v2 contract events (DisputeCrowdsourcer interactions)
2. **Calculation**: `(Largest Dispute Bond / 275,000 REP) × 100 = Risk %`
3. **Storage**: `public/data/fork-risk.json` (hourly via GitHub Actions)
4. **Frontend**: ForkDataProvider loads + refreshes every 5 minutes
5. **Rendering**: ForkGauge component animates the percentage visualization

### RPC Failover Strategy
- Primary: LlamaRPC → LinkPool → PublicNode → 1RPC
- All public endpoints, zero API keys required
- Graceful fallback to cached data on failure

## Custom Tailwind Utilities

```css
/* From src/styles/global.css */
fx-glow           /* Primary color drop shadow */
fx-glow-sm|lg     /* Variable sizes */
fx-box-glow       /* Box shadow variant */
fx-box-glow-sm|lg /* Sizes */
```

## Memory Organization

See `.claude/memory/` for:
- **learnings/** - Troubleshooting solutions from past sessions
- **conventions/** - Project standards and patterns
- **architecture/** - Design decisions and rationale
- **decisions/** - ADRs and key choices

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Dev server not found | `lsof -ti:4321` to check, then `npm run dev` |
| Type errors | `npm run typecheck` (uses project references) |
| Fork data stale | `npm run build:fork-risk` or wait for hourly GitHub Actions run |
| Styling not applied | Check `src/styles/global.css` (not tailwind.config.js) |
| Demo mode not working | Press `F2` in development build only (production-safe) |
| GPU memory leak | Add dispose() call in React cleanup effect |

## Resources & References

- **Astro Framework**: Use astro-dev skill for latest patterns
- **View Transitions**: `.claude/memory/architecture/view-transitions.md`
- **Fork Risk System**: `.claude/memory/architecture/fork-risk-system.md`
- **Styling Guide**: `.claude/memory/conventions/tailwind-v4.md`

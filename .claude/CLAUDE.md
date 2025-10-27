# CLAUDE.md

Guidance for Claude Code working on the Augur website project. See `.claude/memory/` for detailed architecture and conventions.

# CRITICAL OVERRIDES

## Development Server
**NEVER** spawn new servers - **ALWAYS** check `lsof -ti:4321` first
**MUST** use existing server on localhost:4321
**DO NOT** wait for `npm run dev` to complete

## Styling
**ALWAYS** edit `src/styles/global.css` (NO config files)
**MUST** use `@theme` and `@utility` directives (Tailwind v4)
**NEVER** assume tailwind.config.js exists

## Architecture
**NEVER** add state logic to rendering components - use stores
**ALWAYS** make components purely reactive to state
**NEVER** add defensive code that violates separation of concerns
**ALWAYS** handle initialization in stores, not component effects

## Deployment
**CRITICAL**: Production is GitHub Pages (static), NOT Cloudflare
**NEVER** add site URL to Cloudflare config
**ALWAYS** ensure SEO works in static output mode

## WebGL
**ALWAYS** implement dispose() for GPU resources
**MUST** call dispose() in React cleanup effects
**NEVER** render after disposal - add isDisposed guards

# QUICK START

## Stack & Architecture
- **Framework**: Astro 5.10+ + React 19 (selective hydration)
- **Styling**: Tailwind CSS 4.1 (CSS-first with @theme/@utility)
- **Hosting**: GitHub Pages (production), Cloudflare (dev)
- **Dev Server**: localhost:4321
- **State**: Nanostores (global), React Context (providers)

See `.claude/memory/architecture/components.md` for detailed component architecture.

## Before Changes
1. Check server: `lsof -ti:4321`
2. Type check: `npm run typecheck`
3. Reference: `.claude/memory/project_overview.md`

## Core Commands
```
npm run dev              # Start dev server (localhost:4321)
npm run build            # Production build
npm run typecheck        # Type validation (project refs)
npm run lint             # Biome linter (tabs + single quotes)
npm run build:fork-data  # Calculate fork risk data
```

# FORK RISK MONITORING

Real-time visualization of Augur v2 protocol fork risk with dual-runtime architecture:

**Risk Formula**: `(Largest Dispute Bond / 275,000 REP) × 100 = Risk %`

**Data Flow**:
- GitHub Actions: Hourly blockchain data collection
- Storage: `public/data/fork-risk.json` (fresh on each build)
- Frontend: 5-minute auto-refresh with fallback
- Demo Mode: `F2` shortcut (dev-only scenarios)

See `.claude/memory/architecture/fork-risk-system.md` for detailed integration, RPC failover, and event monitoring.

## Key Fork Risk Patterns
- `ForkDataProvider.tsx` - Data loading + 5min refresh
- `ForkMockProvider.tsx` - Demo mode (F2 key)
- `ForkGauge.tsx` - SVG animated gauge
- `ForkStats.tsx` - Data panels
- `calculate-fork-risk.ts` - Blockchain script (Node.js 22+)

```bash
npm run build:fork-data          # Local calculation
cat public/data/fork-risk.json   # View data
```

# MEMORY STRUCTURE

Project knowledge organized in `.claude/memory/`:

| Location | Purpose |
|----------|---------|
| `project_overview.md` | Quick reference (stack, features, commands) |
| `architecture/components.md` | Component structure and hydration |
| `architecture/fork-risk-system.md` | Fork risk integration details |
| `conventions/` | Project patterns and standards |
| `learnings/` | Solutions from past sessions |
| `decisions/` | Architecture Decision Records |

# ADDITIONAL RESOURCES

- **Framework**: Use `astro-dev` skill for latest Astro patterns
- **Memory Management**: Use `claude-code-memory` skill for memory maintenance
- **View Transitions**: See `.claude/memory/architecture/view-transitions.md`
- **Project Details**: See `.claude/memory/project_overview.md`

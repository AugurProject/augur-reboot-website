# CLAUDE.md

Guidance for Claude Code working on the Augur website project. See `.claude/memory/` for detailed architecture, decisions, and conventions.

## Stack & Architecture
- **Framework**: Astro 5.10+ + React 19 (selective hydration)
- **Styling**: Tailwind CSS 4.1 (CSS-first with @theme/@utility)
- **State**: Nanostores (global), React Context (providers)
- **Hosting**: GitHub Pages (production, static), Cloudflare (development)
- **Dev Server**: localhost:4321

## Key Conventions
See `.claude/memory/conventions/` for detailed patterns and rationale:

| Topic | Convention | Reference |
|-------|-----------|-----------|
| **Styling** | Always edit `src/styles/global.css`, never config files | [Styling Standards](`./.claude/memory/conventions/styling-standards.md`) |
| **Components** | State in stores, components purely reactive, hydration patterns | [Component Patterns](`./.claude/memory/conventions/component-patterns.md`) |
| **Dev Workflow** | Check server before starting, use existing instance | [Development Workflow](`./.claude/memory/conventions/development-workflow.md`) |
| **Resources** | Call `dispose()` for GPU cleanup in React effects | [Resource Management](`./.claude/memory/conventions/resource-management.md`) |

## Architecture Decisions
See `.claude/memory/decisions/` for decision rationale:

| Decision | Details |
|----------|---------|
| **Deployment** | [GitHub Pages static](`./.claude/memory/decisions/deployment-architecture.md`), not Cloudflare production |
| **Framework** | [Astro + React selective hydration](`./.claude/memory/decisions/frontend-framework.md`) |
| **Styling** | [Tailwind v4 CSS-first](`./.claude/memory/decisions/styling-architecture.md`) with `@theme` and `@utility` |
| **State** | [Nanostores + React Context](`./.claude/memory/decisions/state-management.md`) |

## Core Commands
```bash
npm run dev              # Start dev server (localhost:4321)
npm run typecheck        # Type validation (project refs)
npm run lint             # Biome linter
npm run build            # Production build
npm run preview          # Preview built site
npm run build:fork-data  # Calculate fork risk data
```

## Architecture Docs
- [Fork Risk System](`./.claude/memory/architecture/fork-risk-system.md`) - Dual-runtime, data flow, blockchain integration

## Fork Risk Monitoring
Real-time Augur v2 protocol fork risk visualization:
- **Formula**: `(Largest Dispute Bond / 275,000 REP) × 100 = Risk %`
- **Data**: Hourly blockchain collection → `public/data/fork-risk.json` → 5-min client refresh
- **Demo Mode**: Press `F2` in development (dev-only scenarios)
- **Components**: `ForkMonitor.tsx`, `ForkGauge.tsx`, `ForkStats.tsx`, `ForkDisplay.tsx`

See [fork-risk-system.md](`./.claude/memory/architecture/fork-risk-system.md`) for integration details and RPC failover.

## Memory Structure
```
.claude/memory/
├── conventions/                     # How we implement decisions
│   ├── component-patterns.md        # Component architecture + hydration
│   ├── development-workflow.md      # Dev server, build, git workflow
│   ├── styling-standards.md         # Tailwind v4 @theme/@utility patterns
│   └── resource-management.md       # WebGL cleanup, dispose() patterns
├── decisions/                       # Why we made these choices
│   ├── deployment-architecture.md   # GitHub Pages static deployment
│   ├── frontend-framework.md        # Astro 5.10+ + React 19 islands
│   ├── styling-architecture.md      # Tailwind v4 CSS-first
│   └── state-management.md          # Nanostores + React Context
├── architecture/                    # Technical deep dives
│   └── fork-risk-system.md          # Dual-runtime, data pipeline, blockchain
└── learnings/                       # Solutions from past sessions (future)
```

## Skills Available
- **astro-dev**: Latest Astro framework patterns and best practices
- **claude-code-memory**: Memory management workflows and audits

## Troubleshooting

**Dev Server Issues**: See [development-workflow.md](`./.claude/memory/conventions/development-workflow.md`)
- Dev server port conflicts (`lsof -ti:4321`)
- Type checking failures (`npm run typecheck`)

**Fork Risk Data**: See [fork-risk-system.md](`./.claude/memory/architecture/fork-risk-system.md`)
- Stale fork risk data (`npm run build:fork-data`)
- RPC endpoint failover, demo mode (`F2`)

**Styling Issues**: See [styling-standards.md](`./.claude/memory/conventions/styling-standards.md`)
- Styling not applied (check `src/styles/global.css`)
- Custom utilities (fx-glow, fx-box-glow)

**GPU Memory Leaks**: See [resource-management.md](`./.claude/memory/conventions/resource-management.md`)
- Always implement `dispose()` for WebGL resources
- Call in React cleanup effects

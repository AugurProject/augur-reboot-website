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
| **Components** | State in stores, components purely reactive | [Component Architecture](`./.claude/memory/conventions/component-architecture.md`) |
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
- [Component Architecture](`./.claude/memory/architecture/components.md`) - Structure, hydration, lifecycle
- [Fork Risk System](`./.claude/memory/architecture/fork-risk-system.md`) - Dual-runtime, data flow, blockchain integration
- [Project Overview](`./.claude/memory/project_overview.md`) - Features, structure, troubleshooting

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
├── project_overview.md              # Quick reference & troubleshooting
├── conventions/                     # How we implement decisions
│   ├── development-workflow.md
│   ├── styling-standards.md
│   ├── component-architecture.md
│   └── resource-management.md
├── decisions/                       # Why we made these choices
│   ├── deployment-architecture.md
│   ├── frontend-framework.md
│   ├── styling-architecture.md
│   └── state-management.md
├── architecture/                    # Technical deep dives
│   ├── components.md
│   └── fork-risk-system.md
├── learnings/                       # Solutions from past sessions
└── conventions/                     # Standards & patterns
```

## Skills Available
- **astro-dev**: Latest Astro framework patterns and best practices
- **claude-code-memory**: Memory management workflows and audits

## Troubleshooting
See [project overview](`./.claude/memory/project_overview.md`) for common issues like:
- Dev server port conflicts
- Type checking failures
- Stale fork risk data
- Styling not applied
- Demo mode issues
- GPU memory leaks

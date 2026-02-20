# Project Context

## Key Documentation References

**Fork Risk Monitoring System** (`docs/fork-risk-monitoring-system.md`): Complete documentation of the hourly fork risk monitoring system. Covers: why the system was built (problem statement), design approach (GitHub Actions + event-driven validation), architecture details (two-job workflow with concurrency locking), implementation (all code changes), testing results, RPC budget analysis, failure scenarios, and operational monitoring. Start here for complete understanding of how fork monitoring works.

**Fork Risk Assessment** (`docs/fork-risk-assessment.md`): Methodology for calculating fork risk, risk thresholds, blockchain data sources, RPC failover strategy, and transparency/auditability approach. Read when implementing or debugging fork risk features.

**Technical Architecture** (`docs/technical-architecture.md`): React/TypeScript component architecture, component hierarchy, state management patterns (Context API), UI patterns, and visual rendering details. Read when building or modifying UI components.

**Augur Protocol Reference** (`docs/augur-protocol-reference.md`): Fork trigger mechanics, dispute bond formulas, REP migration process, security model, and protocol constants (275K REP threshold, 60-day fork duration, etc.). Read for protocol understanding and edge cases.

**Blog and Content Structure** (`docs/blog.md`): Blog post organization, frontmatter schema, MDX integration, RSS feed generation, and Learn section collection structure. Read when adding or modifying blog content.

## Technical Constraints

- **Astro 5.10+**: Build-time HTML generation with selective client hydration. No full SPA mode.
- **Dual TypeScript Runtimes**: Frontend (tsconfig.app.json) and backend scripts (tsconfig.scripts.json) require separate compilation contexts.
- **Static Deployment Only**: GitHub Pages hosting requires pre-built static output. No server-side rendering or dynamic routes.

## Architectural Decisions

- **Frontend Framework**: Astro 5.10+ with React 19 islands architecture. Always specify hydration directives (client:load for critical animations). NEVER forget hydration—component won't be interactive.
- **State Management**: Nanostores for global state + React Context for providers. NEVER add state logic to components—keep them purely reactive. Initialization logic belongs in stores, not component effects.
- **Styling**: Tailwind v4 CSS-first via @theme/@utility directives in src/styles/global.css. No tailwind.config.js—it doesn't exist.
- **Deployment**: GitHub Pages static deployment for production. Must verify sitemap generation in GitHub Actions.
- **SVG-Based Fork Gauge**: SVG provides resolution-independent visualization, GPU-accelerated animations, easy styling. Preferred over Canvas.

## Team Conventions

- **Component State**: State in stores/context ONLY, never in components. Components are purely reactive. Initialization logic belongs in stores, not useEffect.
- **Development Workflow**: Check dev server before starting: `lsof -ti:4321`. Only run `npm run dev` if port is free. **Pre-commit checks (required before every commit)**: typecheck, lint. **Pre-merge checks (required before merging)**: typecheck, lint, build.
- **GPU Resources**: WebGL components MUST implement dispose() and call it in useEffect cleanup. Guard with isDisposed flag. Never render after disposal.
- **Styling Standards**: ALWAYS edit `src/styles/global.css` ONLY. Use @theme and @utility directives. Custom utils: `fx-glow`, `fx-glow-*` (size variants), `fx-box-glow`, `fx-box-glow-*` (size variants), `fx-pulse-glow`.
- **Demo Mode**: Press F2 in dev to toggle fork risk scenarios (None, Low, Moderate, High, Critical). Dev-only feature with production guards—safe to leave in code.

## Implementation Quirks

- **Astro Scoped Styles**: Component <style> blocks auto-scoped with data-astro-cid-* attributes. Use is:global for truly global styles.
- **Fork Risk Details**: See `docs/fork-risk-assessment.md` (calculation) and `docs/fork-risk-monitoring-system.md` (operations).

## Tools & Workflow

- **Workspace Management**: Use `jubalm/workspace` for worktree management (`ws` alias if installed locally—check `ws --help`)
- **Linting**: `@biomejs/biome` for type checking and formatting (runs in pre-commit, pre-merge CI)
- **Skills**: Use `fork-gauge` for visualization work, `blogging` for content, `island-state` for state management patterns, `tailwind-v4-validator` for Tailwind class validation
- **Code Review**: Use superpowers skill for brainstorming, debugging, planning, and code review workflows

## Content & Features

- **Blog System**: 8+ MDX blog posts with RSS feed, frontmatter metadata, and topic classification
- **Learn Section**: Educational content collection with similar structure to blog
- **Integrations**: `@astrojs/mdx` for MDX processing, `@astrojs/rss` for feed generation

## Git Workflow

- **DO NOT auto-commit changes** unless explicitly instructed
- Stage all changes and wait for direction before committing

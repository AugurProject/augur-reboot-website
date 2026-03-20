# Project Context

## Key Documentation References

**Fork Risk Monitoring System** (`docs/fork-risk-monitoring-system.md`): Complete documentation of the hourly fork risk monitoring system. Covers: why the system was built (problem statement), design approach (GitHub Actions + event-driven validation), architecture details (two-job workflow with concurrency locking), implementation (all code changes), testing results, RPC budget analysis, failure scenarios, and operational monitoring. Start here for complete understanding of how fork monitoring works.

**Fork Risk Assessment** (`docs/fork-risk-assessment.md`): Methodology for calculating fork risk, risk thresholds, blockchain data sources, RPC failover strategy, and transparency/auditability approach. Read when implementing or debugging fork risk features.

**Technical Architecture** (`docs/technical-architecture.md`): React/TypeScript component architecture, component hierarchy, state management patterns (Context API), UI patterns, and visual rendering details. Read when building or modifying UI components.

**Augur Protocol Reference** (`docs/augur-protocol-v2-reference.md`): Fork trigger mechanics, dispute bond formulas, REP migration process, security model, and protocol constants (275K REP threshold, 60-day fork duration, etc.). Read for protocol understanding and edge cases.

**Blog and Content Structure** (`docs/blog-feature.md`): Blog post organization, frontmatter schema, MDX integration, RSS feed generation, and Learn section collection structure. Read when adding or modifying blog content.

## Technical Constraints

- **Astro 5.10+**: Build-time HTML generation with selective client hydration. No full SPA mode.
- **Dual TypeScript Runtimes**: Frontend (tsconfig.app.json) and backend scripts (tsconfig.scripts.json) require separate compilation contexts.
- **Static Deployment Only**: GitHub Pages hosting requires pre-built static output. No server-side rendering or dynamic routes. Must verify sitemap generation in GitHub Actions.
- **Astro Scoped Styles**: Component `<style>` blocks are auto-scoped with `data-astro-cid-*` attributes. Use `is:global` for truly global styles.

## Architectural Decisions

- **Frontend Framework**: Astro 5.10+ with React 19 islands architecture. Always specify hydration directives (client:load for critical animations). NEVER forget hydration—component won't be interactive.
- **Styling**: Tailwind v4 CSS-first via @theme/@utility directives in src/styles/global.css. No tailwind.config.js—it doesn't exist.

## Team Conventions

- **Component State**: Nanostores for global state + React Context for providers. State in stores/context ONLY, never in components. Components are purely reactive. Initialization logic belongs in stores, not useEffect.
- **Development Workflow**: Check dev server before starting: `lsof -ti:4321`. Only run `npm run dev` if port is free. **Pre-commit checks (required before every commit)**: typecheck, lint. **Pre-merge checks (required before merging)**: typecheck, lint, build.
- **GPU Resources**: WebGL components MUST implement dispose() and call it in useEffect cleanup. Guard with isDisposed flag. Never render after disposal.
- **Styling Standards**: ALWAYS edit `src/styles/global.css` ONLY. Use @theme and @utility directives. Custom utils: `fx-glow`, `fx-glow-*` (size variants), `fx-box-glow`, `fx-box-glow-*` (size variants), `fx-pulse-glow`.
- **Skills**: Use `fork-gauge` for visualization work, `blogging` for content, `island-state` for state management patterns, `tailwind-v4-validator` for Tailwind class validation.

## Git Workflow

- **DO NOT auto-commit changes** unless explicitly instructed
- Stage all changes and wait for direction before committing

# Project Context

## Key Documentation References

**Cache Architecture Implementation**
- `docs/IMPLEMENTATION_SUMMARY.md`: What was built, testing results, deployment notes. Start here.
- `docs/proposed-cache-architecture-gh-actions.md`: Design rationale, trade-offs, failure scenarios. Reference for why decisions were made.

**Fork Risk Assessment** (`docs/fork-risk-assessment.md`): Methodology for calculating fork risk, risk thresholds, blockchain data sources, RPC failover strategy, and transparency/auditability approach. Read when implementing or debugging fork risk features.

**Technical Architecture** (`docs/technical-architecture.md`): React/TypeScript component architecture, component hierarchy, state management patterns (Context API), UI patterns, and visual rendering details. Read when building or modifying UI components.

**Augur Protocol Reference** (`docs/augur-protocol-reference.md`): Fork trigger mechanics, dispute bond formulas, REP migration process, security model, and protocol constants (275K REP threshold, 60-day fork duration, etc.). Read for protocol understanding and edge cases.

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
- **Development Workflow**: Check dev server before starting: `lsof -ti:4321`. Only run `npm run dev` if port is free. Always run: typecheck, lint, build before merging.
- **GPU Resources**: WebGL components MUST implement dispose() and call it in useEffect cleanup. Guard with isDisposed flag. Never render after disposal.
- **Styling Standards**: ALWAYS edit `src/styles/global.css` ONLY. Use @theme and @utility directives. Custom utils: fx-glow, fx-glow-sm/lg, fx-box-glow.
- **Demo Mode**: Press F2 in dev to toggle fork risk scenarios (None, Low, Moderate, High, Critical). Dev-only feature with production guards—safe to leave in code.

## Implementation Quirks

- **Astro Scoped Styles**: Component <style> blocks auto-scoped with data-astro-cid-* attributes. Use is:global for truly global styles.
- **Fork Risk Formula**: (Largest Dispute Bond / 275,000 REP) × 100 = Risk %. Smaller denominator would severely underestimate risk.
- **RPC Endpoint Failover**: Uses 4 public endpoints (LlamaRPC, LinkPool, PublicNode, 1RPC) with auto-fallback. No API keys needed.

## Documentation Maintenance

**Removed (outdated strategies, replaced by current implementation)**:
- `docs/rpc-caching-strategy.md` - Old 6-hourly approach (superseded by hourly monitoring)
- `docs/pending-fork-risk-decisions.md` - Provisional decisions (now implemented)
- `docs/plans/cache-architecture-implementation.md` - Implementation plan (work completed)

Keep documentation focused on **current implemented state**, not historical exploration paths.

## Tools & Workflow

- **Workspace Management**: Use `jubalm/workspace` for worktree management (`ws` alias if installed locally—check `ws --help`)
- **Skills**: Use astro-dev skill for modern Astro framework patterns and best practices with React islands
- **Code Review**: Use superpowers skill for brainstorming, debugging, planning, and code review workflows

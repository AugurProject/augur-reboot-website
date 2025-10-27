# Deployment Architecture Decision

## Decision
**Production deployment is GitHub Pages (static), NOT Cloudflare Workers/Pages**

## Rationale
- Static site generation via Astro provides fast, reliable deployment
- GitHub Pages integrates directly with repository
- SEO optimization works in static output mode
- Simpler deployment pipeline than Cloudflare Workers
- Development environment uses Cloudflare adapter (SSR) for testing, but production is static-only

## Implementation
- Production builds deploy to GitHub Pages via GitHub Actions
- Main branch auto-deploys to https://augur.net
- Development uses Cloudflare adapter with `npm run preview` for local testing
- `npm run build` generates static output to `./dist/`

## Critical Rules
- **NEVER** add site URL to Cloudflare config (production doesn't use it)
- **ALWAYS** ensure SEO features work in static output mode
- **MUST** verify sitemap generation happens in GitHub Actions, not local development
- Test static builds locally with `npm run build && npm run preview`

## Related Decisions
- See `frontend-framework.md` for Astro's role in static generation
- See `.claude/memory/architecture/components.md` for component hydration in static context

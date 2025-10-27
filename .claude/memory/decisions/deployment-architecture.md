# Deployment Architecture Decision

## Decision
**Production deployment is GitHub Pages (static), NOT Cloudflare Workers/Pages for runtime**

## Rationale

### Why GitHub Pages Static
1. **Simplicity**: One deployment target, no server complexity
2. **Cost**: Free tier sufficient for marketing website
3. **Performance**: CDN distribution via GitHub Pages is excellent
4. **SEO**: Static site structure ideal for search engine crawling
5. **Repository Integration**: Zero additional configuration, deploy on main branch update

### Alternatives Considered

**Option 1: Cloudflare Pages (Dynamic/Workers)**
- *Rejected*: Adds complexity for SSR when static is sufficient
- *Trade-off*: Could handle form submissions, API routes, but marketing site doesn't need these
- *Cost*: More expensive for production workloads (though dev uses Cloudflare for testing)

**Option 2: Vercel**
- *Rejected*: Similar to Cloudflare, overkill for static site
- *Trade-off*: Better preview deploys, but GitHub Pages is already integrated

**Option 3: Self-hosted VPS**
- *Rejected*: Operational overhead not worth it for marketing site
- *Trade-off*: Full control but requires DevOps resources

## Implementation

**Production Pipeline**:
```
main branch → GitHub Actions → npm run build → GitHub Pages (static)
↓
Deploy to: https://augur.net
```

**Development Testing**:
- Uses Cloudflare adapter for local SSR testing with `npm run preview`
- Tests static production build with `npm run build && npm run preview`
- Both approaches run on localhost:4321

**Key Outputs**:
- `npm run build` → `./dist/` (static HTML + assets)
- GitHub Actions commits fresh fork-risk.json before each deploy
- Sitemap and robots.txt generated during build process

## Critical Rules
- **NEVER** add site URL to Cloudflare `wrangler.toml` config (production doesn't use it)
- **ALWAYS** ensure SEO features (sitemap, canonical URLs) work in static output
- **MUST** verify sitemap generation in GitHub Actions, not local development
- **DO** test production build locally: `npm run build && npm run preview`
- **DO NOT** rely on server-side features (API routes, middleware) in production

## Trade-offs Made

| Choice | Benefit | Cost |
|--------|---------|------|
| GitHub Pages Static | Simplicity, cost, CDN | Can't handle form submissions |
| Cloudflare Adapter for Dev | Test SSR locally | Extra tool for dev-only testing |
| Dual-runtime TypeScript | Type-safe blockchain scripts | Fork risk data must be pre-generated |

## Related Decisions
- See `frontend-framework.md` for why Astro static generation was chosen
- See `styling-architecture.md` for how CSS is optimized in static builds

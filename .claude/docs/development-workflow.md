# Development Workflow

## Critical Development Rules
**NEVER** spawn new dev servers - **ALWAYS** check `lsof -ti:4321` first
**MUST** use existing server on localhost:4321 for all testing
**DO NOT** wait for `npm run dev` to complete before proceeding with other tasks
**ALWAYS** create development worktrees in `.workbench` directory for isolated feature development

## Before Making Changes
1. **CHECK**: Is dev server running? `lsof -ti:4321`
2. **REFERENCE**: Use project organization principles in project-architecture.md to locate components and state
3. **STYLING**: For CSS utilities and patterns, see styling-patterns.md
4. **DISCOVERY**: Use `git ls-files` to find specific files within the project structure

## Git Worktrees
**ALWAYS** create development worktrees in `.workbench` directory for isolated feature development
**MUST** use descriptive branch names: `feature-name`, `fix-issue`, `workflow-enhancements`
**PATTERN**: `git worktree add .workbench/branch-name -b branch-name`

```bash
# Create new worktree for feature development
git worktree add .workbench/my-feature -b my-feature

# Remove worktree when done
git worktree remove .workbench/my-feature
git branch -d my-feature
```

## Development Commands

**Core Development**
| Command | Action |
|---------|---------|
| `npm run dev` | Start development server at localhost:4321 |
| `npm run build` | Build production site to ./dist/ |
| `npm run preview` | Build and preview with Wrangler (Cloudflare) |
| `npm run deploy` | Deploy to Cloudflare Pages |
| `npm run cf-typegen` | Generate Cloudflare Worker types |

**Data & Risk Calculation**
| Command | Action |
|---------|---------|
| `npm run build:fork-data` | Calculate fork risk data using TypeScript scripts (requires Node.js 22+ with --experimental-strip-types) |
| `npm run typecheck` | Type-check all TypeScript files using project references |
| `npm run lint` | Run Biome linter with tab indentation and single quotes |

## Build and Deployment Process

### Local Development
1. Ensure dev server is running on localhost:4321
2. Use Cloudflare adapter for local SSR development
3. Test fork risk monitoring with F2 demo mode

### Production Deployment
1. **Target**: GitHub Pages (static) - main branch auto-deploys to https://augur.net
2. **Build Process**: GitHub Actions runs fork risk calculation before static build
3. **SEO**: Sitemap generation happens in GitHub Actions, not local development
4. **Verification**: Ensure all features work in static output mode

### Quality Checks
- Run `npm run typecheck` before committing
- Run `npm run lint` to ensure code style compliance
- Test fork risk monitoring functionality
- Verify static build works correctly for production
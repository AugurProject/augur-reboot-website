# Development Workflow Conventions

## Development Server Management

### Server Rules
- **DO NOT** wait for `npm run dev` to complete before proceeding with other tasks
- Dev server runs at localhost:4321 via Cloudflare adapter (SSR mode for development)

### Starting Dev Server (if needed)
```bash
npm run dev  # Only if no server found by lsof check
```

## Build & Testing Workflow

### Type Checking
```bash
npm run typecheck
```
- Uses TypeScript project references for dual-runtime validation
- Checks both `tsconfig.app.json` (frontend) and `tsconfig.scripts.json` (backend)
- Must pass before committing

### Linting
```bash
npm run lint
```
- Uses Biome linter with specific configuration
- Enforces: tabs (not spaces), single quotes (not double)
- Must pass before committing

### Local Testing Build
```bash
npm run build      # Production build to ./dist/
npm run preview    # View built site with Wrangler
```
- `npm run build` creates static output (GitHub Pages compatible)
- `npm run preview` tests with Cloudflare adapter locally

### Fork Risk Data
```bash
npm run build:fork-data
```
- Calculates fresh fork risk data using blockchain RPC calls
- Requires Node.js 22+
- Generates `public/data/fork-risk.json`
- Run before local testing if fork risk system changed

## Branching & Commit Workflow

### Working with Worktrees
```bash
git worktree add feature/branch-name
cd ../feature-branch-name
# Work in isolated directory
git commit -m "message"
git push -u origin feature/branch-name
```

### Commit Messages
- Use conventional commits format: `type: description`
- Types: feat, fix, refactor, docs, test, chore
- Keep messages focused on "why" not "what"

### Before Merging to Main
- All tests pass: `npm run typecheck && npm run lint`
- Build succeeds: `npm run build`
- Fork risk data fresh (if applicable)
- Create PR with summary of changes
- Request review

## Development Commands Quick Reference

| Command | Purpose |
|---------|---------|
| `lsof -ti:4321` | Check if dev server running |
| `npm run dev` | Start dev server (localhost:4321) |
| `npm run typecheck` | Full TypeScript validation |
| `npm run lint` | Biome linting |
| `npm run build` | Production build |
| `npm run preview` | Preview built site |
| `npm run build:fork-data` | Calculate fork risk data |

## Common Issues

### Dev Server Port Conflict
**Problem**: Cannot start dev server
**Solution**: `lsof -ti:4321` to find existing process, kill if stale, or use existing server

### Type Errors
**Problem**: `npm run typecheck` fails
**Solution**: Fix reported errors, or check project references are correct in root tsconfig.json

### Stale fork risk data
**Problem**: Fork risk gauge shows old numbers
**Solution**: `npm run build:fork-data` to refresh locally, or wait for hourly GitHub Actions run

## Related Conventions
- See `styling-standards.md` for styling workflow
- See `component-architecture.md` for component development patterns
- See `.claude/memory/project_overview.md` for project context

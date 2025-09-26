# Development Guidelines

## Rules & Recommendations

**MUST** read `.claude/docs/project-architecture.md` prior to any development work
**MUST** create development worktrees in `.workbench` directory for isolated feature development
**ALWAYS** use descriptive branch names: `feature-name`, `fix-issue`, `workflow-enhancements`
**NEVER** commit work nor push changes in `main` branch
**ALWAYS** run `npm run cf-typegen` when changing `wrangler.jsonc` file

## Source Code Navigation
Use `.claude/docs/project-architecture.md` as reference to understand tech stack and codebase structure
Use `git ls-files` or similar tools to understand codebase structure

## Development Workflow

### 1. Issue Assessment
- Check if GitHub issue has a linked PR
- Review issue requirements and acceptance criteria
- Identify related documentation and component patterns

### 2. Worktree Setup
```bash
# Create new worktree for feature/fix
git worktree add .workbench/issue-123-feature-name -b issue-123-feature-name

# Navigate to worktree
cd .workbench/issue-123-feature-name

# Verify location
pwd  # Should show .workbench/issue-123-feature-name path
```

### 3. Development Process
- Implement changes following architectural patterns
- Test changes locally with `npm run dev`
- Run quality checks: `npm run lint && npm run typecheck`
- Ensure build succeeds: `npm run build`

### 4. Commit and PR
- Commit with conventional message format
- Create PR with descriptive title and summary
- Link PR to original issue

## Build and Deployment Workflow

### Local Testing
```bash
# Start development server
npm run dev  # Access at localhost:4321

# Test production build locally
npm run build && npm run preview
```

### Pre-deployment Checks
- Type checking: `npm run typecheck`
- Linting: `npm run lint`
- Production build: `npm run build`

### Deployment Environments

#### Staging (Cloudflare Workers)
- Manual deployment: `npm run deploy`
- Uses Cloudflare adapter for SSR testing
- Preview environment before production

#### Production (GitHub Pages)
- **Automatic**: Push to `main` branch triggers deployment
- **Manual**: GitHub Actions can be manually triggered
- **URL**: https://augur.net

### Deployment Verification
- Verify build completed successfully
- Check basic site functionality
- Monitor for deployment errors

## Development Commands

**Core Development**
| Command | Action |
|---------|---------|
| `npm run dev` | Start development server at localhost:4321 |
| `npm run build` | Build production site to ./dist/ |
| `npm run preview` | Preview production build locally with Cloudflare adapter |
| `npm run deploy` | Deploy to Cloudflare Pages |
| `npm run cf-typegen` | Generate Cloudflare Worker types |

**Data & Risk Calculation**
| Command | Action |
|---------|---------|
| `npm run build:fork-data` | Calculate fork risk data using TypeScript scripts |
| `npm run typecheck` | Type-check all TypeScript files using project references |
| `npm run lint` | Run Biome linter with tab indentation and single quotes |


# Git Worktree Management

This directory contains utilities for managing Git worktrees, allowing you to work on multiple branches simultaneously without manually switching between them.

## What are Git Worktrees?

Git worktrees allow you to have multiple working directories attached to the same repository. Each worktree can be on a different branch, enabling:

- **Parallel development** - Work on multiple features at once
- **Code reviews** - Check out someone else's branch without switching your current work
- **Testing** - Quickly verify branches without rebuilding
- **CI/local debugging** - Maintain a clean worktree for testing

## Installation

The script is already in your repository at `scripts/worktree/main.sh`. You can create an alias for convenience:

```bash
# Add to your shell config (~/.bashrc, ~/.zshrc, etc.)
alias worktree='./scripts/worktree/main.sh'
```

Then you can use:
```bash
worktree feature/new-ui
```

## Quick Start

### Create a worktree from existing branch
```bash
./scripts/worktree/main.sh origin/main
./scripts/worktree/main.sh origin/feature/existing-branch
```

### Create a new branch in a worktree (from main)
```bash
./scripts/worktree/main.sh feature/update-technical-implementation
```

### Create a new branch from a custom base
```bash
./scripts/worktree/main.sh feature/hotfix --base production
```

### List all worktrees
```bash
./scripts/worktree/main.sh list
```

### Remove a worktree when done
```bash
./scripts/worktree/main.sh remove feature-new-ui
```

## Usage Guide

### Basic Workflow

1. **Create a worktree**
   ```bash
   ./scripts/worktree/main.sh feature/my-feature
   ```
   - Creates `.worktree/feature-my-feature/` directory
   - Creates a local branch `feature-my-feature` (if new) or checks out existing branch
   - Automatically runs `npm install` and applies database migrations
   - Opens `.worktree/feature-my-feature/` ready for development

2. **Develop in the worktree**
   ```bash
   cd .worktree/feature-my-feature
   npm run dev
   # Make your changes, commit, push
   ```

3. **Remove when done**
   ```bash
   cd ..  # Go back to main worktree
   ./scripts/worktree/main.sh remove feature-my-feature
   ```

### Advanced Usage

#### Create new branch from custom base
```bash
./scripts/worktree/main.sh feature/experimental --base develop
# Creates branch from develop, not main
```

#### Skip initialization for faster creation
```bash
./scripts/worktree/main.sh feature/quick --skip-init
# Creates worktree but skips npm install and migrations
# Useful when you need speed and will run setup manually
```

#### Re-initialize existing worktree
```bash
./scripts/worktree/main.sh feature-my-feature
# If worktree exists, re-runs npm install and migrations
# Useful after pulling changes with new dependencies or migrations
```

## How It Works

### Branch Name Handling

The script intelligently handles branch names:

- **Local branches**: Checks them out directly
  ```bash
  ./scripts/worktree/main.sh feature/auth
  # Checks out refs/heads/feature/auth if it exists
  ```

- **Remote branches**: Automatically creates tracking branches
  ```bash
  ./scripts/worktree/main.sh origin/main
  # Checks out origin/main and creates local branch 'main'
  ```

- **Namespaced branches**: Intelligently finds branches with prefixes
  ```bash
  ./scripts/worktree/main.sh review/specs-123
  # Finds origin/review/specs-123 if it exists
  ```

### Directory Naming

Branch names are normalized for directory names:

- Remote prefixes stripped: `origin/feature/auth` → `feature-auth`
- Namespace prefixes stripped: `release/v1.0` → `v1.0`, `review/pr-123` → `pr-123`
- Slashes converted to hyphens: `feature/my-feature` → `feature-my-feature`

Examples:
```
Branch: origin/main                    → Directory: main
Branch: feature/user-auth              → Directory: feature-user-auth
Branch: release/v1.0                   → Directory: v1.0
Branch: bugfix/issue-123               → Directory: bugfix-issue-123
```

### Initialization Process

When creating a new worktree (unless `--skip-init`), the script:

1. **Installs dependencies** (`npm install`)
   - Required for development server and builds
   - Skipped if `package.json` doesn't exist

2. **Applies database migrations** (if applicable)
   - Checks if `migrations/` directory exists
   - Checks if `db:migrate` script exists in `package.json`
   - Runs: `yes | npm run db:migrate` (non-interactive)
   - Creates local D1 database in `.wrangler/state/`
   - Seeds database with sample data

3. **Shows progress and timing**
   ```
   ℹ Initializing worktree...
   ℹ Running npm install...
   ✓ npm dependencies installed
   ℹ Applying database migrations...
   ✓ Database initialized with migrations and seed data
   ✓ Worktree initialization complete! (45s)
   ```

## File Structure

```
.worktree/
├── feature-user-auth/               # One worktree per branch
│   ├── .git                         # Worktree-specific git file
│   ├── package.json
│   ├── node_modules/                # Dependencies (separate per worktree)
│   ├── migrations/                  # Database migrations (if applicable)
│   └── ...other files...
│
├── hotfix-critical-bug/
│   └── ...same structure...
│
└── feature-new-feature/
    └── ...same structure...
```

## Configuration

### Default Base Branch

When creating a new branch without an existing branch:
- **Default**: Uses `main` as the base branch
- **Custom**: Use `--base <branch>` flag

```bash
# Creates from main
./scripts/worktree/main.sh feature/new-feature

# Creates from develop
./scripts/worktree/main.sh feature/new-feature --base develop

# Creates from production
./scripts/worktree/main.sh hotfix/urgent-bug --base production
```

### Worktree Directory

All worktrees are created in `.worktree/` (relative to project root). This directory is:
- Added to `.gitignore` automatically by the script
- Safe to delete (worktrees can be recreated)
- Not committed to git

## Common Workflows

### Feature Development

```bash
# Create new feature branch
./scripts/worktree/main.sh feature/user-dashboard

cd .worktree/feature-user-dashboard
npm run dev
# Develop your feature...
git add .
git commit -m "feat: add user dashboard"
git push

# Go back to main
cd ../..
./scripts/worktree/main.sh remove feature-user-dashboard
```

### Code Review

```bash
# Check out someone else's branch while keeping your work
./scripts/worktree/main.sh review/pr-123

cd .worktree/review-pr-123
npm run dev
# Review the code, test the implementation
# Leave branch as-is, no cleanup needed if you'll check it again

# Check another branch for review
cd ../..
./scripts/worktree/main.sh review/pr-124
```

### Bug Fixes & Hotfixes

```bash
# From production branch
./scripts/worktree/main.sh hotfix/critical-bug --base production

cd .worktree/hotfix-critical-bug
npm run dev
# Fix the bug, test thoroughly
git commit -m "fix: resolve critical issue"
git push

# Back in main worktree
cd ../..
git pull  # Get the hotfix
./scripts/worktree/main.sh remove hotfix-critical-bug
```

### Database Development

```bash
# Create worktree (automatically runs db:migrate)
./scripts/worktree/main.sh feature/new-database-schema

cd .worktree/feature-new-database-schema
# Local database is seeded and ready
npm run dev
# Develop with local database
# Make schema changes, test migrations
```

## Troubleshooting

### "Branch not found" error

The branch doesn't exist locally or remotely. Options:

1. **Create a new branch from main**
   ```bash
   ./scripts/worktree/main.sh feature/my-feature
   # Automatically creates from main
   ```

2. **Create from a specific base**
   ```bash
   ./scripts/worktree/main.sh feature/my-feature --base develop
   ```

3. **Check available branches**
   ```bash
   git branch -a
   ```

### Worktree already exists error

The worktree directory already exists. Options:

1. **Re-initialize it** (updates dependencies and migrations)
   ```bash
   ./scripts/worktree/main.sh feature-my-feature
   ```

2. **Remove and recreate**
   ```bash
   ./scripts/worktree/main.sh remove feature-my-feature
   ./scripts/worktree/main.sh feature/my-feature
   ```

3. **Manual cleanup** (if script fails)
   ```bash
   rm -rf .worktree/feature-my-feature
   git branch -D feature-my-feature
   ```

### npm install fails

The `npm install` step failed during initialization. Options:

1. **Skip initialization and install manually**
   ```bash
   ./scripts/worktree/main.sh feature/my-feature --skip-init
   cd .worktree/feature-my-feature
   npm install
   ```

2. **Re-initialize existing worktree** (after fixing issues)
   ```bash
   ./scripts/worktree/main.sh feature-my-feature
   ```

3. **Check for errors**
   ```bash
   cd .worktree/feature-my-feature
   npm install  # Run manually to see error
   ```

### Database migration fails

The `db:migrate` step failed. Options:

1. **Check database state**
   ```bash
   cd .worktree/feature-my-database
   wrangler d1 execute property-manager --local --command "SELECT * FROM d1_migrations;"
   ```

2. **Reset local database**
   ```bash
   cd .worktree/feature-my-database
   npm run db:reset
   ```

3. **Verify migrations exist**
   ```bash
   ls migrations/
   ```

### Stale worktrees

Worktrees might become stale if:
- The underlying branch was deleted
- The git repository was moved

Cleanup:
```bash
./scripts/worktree/main.sh prune
# Automatically cleans up stale worktree references
```

## Tips & Best Practices

1. **One feature per worktree** - Don't mix changes from different features

2. **Keep main branch clean** - Use worktrees to test before merging

3. **Use descriptive branch names** - They become directory names
   ```bash
   ./scripts/worktree/main.sh feature/user-authentication  # Good
   ./scripts/worktree/main.sh feature/stuff                # Avoid
   ```

4. **Skip init when you know you don't need it**
   ```bash
   ./scripts/worktree/main.sh feature/docs --skip-init
   # Good for documentation-only changes
   ```

5. **Keep your main worktree clean** - Only use `.worktree/` directories for development

6. **Regular cleanup** - Remove worktrees when done
   ```bash
   ./scripts/worktree/main.sh list  # See what you have
   ./scripts/worktree/main.sh remove old-feature
   ```

## Commands Reference

| Command | Purpose |
|---------|---------|
| `./scripts/worktree/main.sh <branch>` | Create worktree, auto-detect if new |
| `./scripts/worktree/main.sh <branch> --skip-init` | Create without npm/migrations |
| `./scripts/worktree/main.sh <branch> --base <base>` | Create new branch from custom base |
| `./scripts/worktree/main.sh list` | List all worktrees |
| `./scripts/worktree/main.sh remove <name>` | Remove a worktree |
| `./scripts/worktree/main.sh prune` | Clean up stale worktrees |
| `./scripts/worktree/main.sh help` | Show this help |

## FAQ

**Q: Can I use worktrees with the same branch in multiple worktrees?**
A: No, git prevents this. Each branch can only be checked out in one worktree at a time.

**Q: Does each worktree have its own node_modules?**
A: Yes! Each worktree runs `npm install` independently, so different versions/dependencies can be isolated.

**Q: Can I have different package.json changes in different worktrees?**
A: Yes, since each worktree is a separate git checkout. Changes are branch-specific.

**Q: Do I need to commit from the worktree or the main directory?**
A: Either works! Git operations (commit, push, pull) work from any worktree on its branch.

**Q: What happens to node_modules when I delete a worktree?**
A: They're deleted along with the worktree directory. Each worktree's dependencies are completely isolated.

**Q: Can I use worktrees with submodules?**
A: Yes, worktrees support submodules just like regular checkouts.

## More Information

- [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
- [Git Worktree Guide](https://www.git-tower.com/learn/git/faq/git-worktrees)

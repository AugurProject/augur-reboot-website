#!/usr/bin/env bash
#
# worktree/main.sh - Git worktree management script
#
# Usage:
#   ./scripts/worktree/main.sh <branch-name>                     Create worktree for branch
#   ./scripts/worktree/main.sh <branch-name> --skip-init         Create without initialization
#   ./scripts/worktree/main.sh <branch-name> --base <base>       Create new branch from base
#   ./scripts/worktree/main.sh list                              List all worktrees
#   ./scripts/worktree/main.sh remove <worktree-name>            Remove a worktree
#   ./scripts/worktree/main.sh prune                             Clean up stale worktrees
#   ./scripts/worktree/main.sh help                              Show this help

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKTREE_DIR=".worktree"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEFAULT_BASE_BRANCH="main"

# Helper functions
info() {
    echo -e "${BLUE}ℹ${NC} $*"
}

success() {
    echo -e "${GREEN}✓${NC} $*"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $*"
}

error() {
    echo -e "${RED}✗${NC} $*" >&2
}

usage() {
    cat <<EOF
Git Worktree Management Script

Usage:
  ./scripts/worktree/main.sh <branch-name>                Create worktree (existing or new from main)
  ./scripts/worktree/main.sh <branch-name> --skip-init    Create without initialization
  ./scripts/worktree/main.sh <branch-name> --base <base>  Create new branch from custom base
  ./scripts/worktree/main.sh list                         List all worktrees
  ./scripts/worktree/main.sh remove <worktree-name>       Remove a worktree
  ./scripts/worktree/main.sh prune                        Clean up stale worktrees
  ./scripts/worktree/main.sh help                         Show this help

Examples:
  ./scripts/worktree/main.sh feature/new-ui                    # Create from existing or new from main
  ./scripts/worktree/main.sh feature/update-impl               # Create new branch from main
  ./scripts/worktree/main.sh feature/auth --base develop       # Create new branch from develop
  ./scripts/worktree/main.sh origin/main                       # Create from remote branch
  ./scripts/worktree/main.sh review/pr-abc123                  # Auto-strips namespace prefixes
  ./scripts/worktree/main.sh feature/ui --skip-init            # Create without initialization (faster)
  ./scripts/worktree/main.sh review-docs                       # Re-run init on existing worktree
  ./scripts/worktree/main.sh list                              # Show all worktrees
  ./scripts/worktree/main.sh remove feature-new-ui             # Remove worktree

Notes:
  - Worktrees are created in .worktree/ directory
  - Directory names automatically strip 'origin/' and namespace prefixes
  - Forward slashes in branch names are converted to hyphens
  - The script ensures .worktree/ is in .gitignore
  - Initialization includes: npm install, database migrations (if applicable)
  - Re-running script on existing worktree will re-initialize it
  - If branch doesn't exist, creates it from main (or custom base with --base flag)

EOF
}

# Ensure we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not a git repository"
        exit 1
    fi
}

# Ensure .worktree is in .gitignore
ensure_gitignore() {
    local gitignore="$PROJECT_ROOT/.gitignore"

    if [ ! -f "$gitignore" ]; then
        warning ".gitignore not found, creating one"
        echo "$WORKTREE_DIR/" > "$gitignore"
        success "Added $WORKTREE_DIR/ to .gitignore"
        return
    fi

    if ! grep -q "^${WORKTREE_DIR}/\?$" "$gitignore"; then
        warning "$WORKTREE_DIR/ not found in .gitignore"
        echo "" >> "$gitignore"
        echo "# git worktrees" >> "$gitignore"
        echo "$WORKTREE_DIR/" >> "$gitignore"
        success "Added $WORKTREE_DIR/ to .gitignore"
    fi
}

# Create .worktree directory if it doesn't exist
ensure_worktree_dir() {
    local worktree_path="$PROJECT_ROOT/$WORKTREE_DIR"
    if [ ! -d "$worktree_path" ]; then
        info "Creating $WORKTREE_DIR/ directory"
        mkdir -p "$worktree_path"
        success "Created $WORKTREE_DIR/ directory"
    fi
}

# Normalize branch name to directory name
# Strips: origin/, remotes/origin/, and other namespace prefixes
# Converts slashes to hyphens
normalize_branch_name() {
    local branch="$1"

    # Strip remote prefixes (e.g., origin/, remotes/origin/)
    branch="${branch#remotes/}"
    branch="${branch#origin/}"

    # Convert slashes to hyphens for directory name
    branch="${branch//\//-}"

    echo "$branch"
}

# Check if branch exists (local or remote)
branch_exists() {
    local branch="$1"

    # Check if it's a local branch
    if git show-ref --verify --quiet "refs/heads/$branch"; then
        return 0
    fi

    # Check if it's a remote branch
    if git show-ref --verify --quiet "refs/remotes/$branch"; then
        return 0
    fi

    # Try with origin/ prefix
    if git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
        return 0
    fi

    return 1
}

# Get the full branch reference
get_branch_ref() {
    local branch="$1"

    # Check local first
    if git show-ref --verify --quiet "refs/heads/$branch"; then
        echo "$branch"
        return 0
    fi

    # Check remote
    if git show-ref --verify --quiet "refs/remotes/$branch"; then
        echo "$branch"
        return 0
    fi

    # Try with origin/ prefix
    if git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
        echo "origin/$branch"
        return 0
    fi

    echo "$branch"
}

# Initialize worktree (npm install, database setup)
initialize_worktree() {
    local worktree_path="$1"
    local skip_init="${2:-false}"

    if [ "$skip_init" = "true" ]; then
        info "Skipping initialization (--skip-init flag set)"
        return 0
    fi

    echo ""
    info "Initializing worktree..."
    local start_time=$(date +%s)

    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        warning "npm not found, skipping npm install"
        return 0
    fi

    # Step 1: npm install
    if [ -f "$worktree_path/package.json" ]; then
        info "Running npm install..."
        if (cd "$worktree_path" && npm install); then
            success "npm dependencies installed"
        else
            error "npm install failed"
            return 1
        fi
    fi

    # Step 2: Database setup (if applicable)
    if [ -d "$worktree_path/migrations" ]; then
        # Check if db:migrate script exists in package.json
        if grep -q '"db:migrate"' "$worktree_path/package.json" 2>/dev/null; then
            info "Applying database migrations..."
            if (cd "$worktree_path" && yes | npm run db:migrate); then
                success "Database initialized with migrations and seed data"
            else
                error "Database initialization failed"
                return 1
            fi
        fi
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo ""
    success "Worktree initialization complete! (${duration}s)"
    return 0
}

# Create a new worktree or initialize existing one
create_worktree() {
    local branch="$1"
    local skip_init="${2:-false}"
    local base_branch="${3:-}"
    local dir_name
    local worktree_path
    local branch_ref
    local is_new_branch=false

    # Normalize branch name for directory
    dir_name=$(normalize_branch_name "$branch")
    worktree_path="$PROJECT_ROOT/$WORKTREE_DIR/$dir_name"

    # Check if worktree already exists
    if [ -d "$worktree_path" ]; then
        info "Worktree already exists: $WORKTREE_DIR/$dir_name"
        info "Re-initializing worktree..."
    else
        info "Creating worktree for branch: $branch"

        # Ensure prerequisites
        ensure_gitignore
        ensure_worktree_dir

        # Check if branch exists
        if branch_exists "$branch"; then
            # Branch exists - use it
            branch_ref=$(get_branch_ref "$branch")
            info "Using existing branch: $branch"
        else
            # Branch doesn't exist - create new from base branch
            is_new_branch=true

            # Use provided base branch or default to main
            if [ -z "$base_branch" ]; then
                base_branch="$DEFAULT_BASE_BRANCH"
            fi

            # Verify base branch exists
            if ! branch_exists "$base_branch"; then
                error "Base branch not found: $base_branch"
                info "Available branches:"
                git branch -a | head -20
                exit 1
            fi

            branch_ref=$(get_branch_ref "$base_branch")
            info "Creating new branch from: $base_branch"
        fi

        # Create the worktree with a local tracking branch
        info "Creating worktree at: $WORKTREE_DIR/$dir_name"
        # Use -b to create local tracking branch with the normalized name
        # This prevents detached HEAD state and creates a proper branch
        if git worktree add -b "$dir_name" "$worktree_path" "$branch_ref"; then
            success "Worktree created successfully!"
            echo ""
            if [ "$is_new_branch" = true ]; then
                info "Branch: $dir_name (new branch from $base_branch)"
            else
                info "Branch: $dir_name (tracking $branch_ref)"
            fi
            info "Location: $worktree_path"
        else
            error "Failed to create worktree"
            exit 1
        fi
    fi

    # Initialize worktree (npm install, database setup, etc.)
    if ! initialize_worktree "$worktree_path" "$skip_init"; then
        error "Worktree initialization failed"
        exit 1
    fi

    echo ""
    info "Next steps:"
    info "  cd $WORKTREE_DIR/$dir_name"
    info "  npm run dev"
    echo ""
    list_worktrees
}

# List all worktrees
list_worktrees() {
    info "Git worktrees:"
    echo ""
    git worktree list
}

# Remove a worktree
remove_worktree() {
    local name="$1"
    local worktree_path="$PROJECT_ROOT/$WORKTREE_DIR/$name"

    # Check if worktree exists
    if [ ! -d "$worktree_path" ]; then
        error "Worktree not found: $WORKTREE_DIR/$name"
        info "Available worktrees:"
        git worktree list
        exit 1
    fi

    info "Removing worktree: $WORKTREE_DIR/$name"

    if git worktree remove "$worktree_path" --force; then
        success "Worktree removed successfully!"
        echo ""
        list_worktrees
    else
        error "Failed to remove worktree"
        warning "You may need to manually remove: $worktree_path"
        exit 1
    fi
}

# Prune stale worktrees
prune_worktrees() {
    info "Pruning stale worktrees..."
    git worktree prune -v
    success "Prune complete"
    echo ""
    list_worktrees
}

# Main script
main() {
    check_git_repo

    # Parse arguments
    local branch=""
    local skip_init=false
    local base_branch=""

    # Handle commands
    case "${1:-}" in
        "" | "-h" | "--help" | "help")
            usage
            exit 0
            ;;
        "list" | "ls")
            list_worktrees
            ;;
        "remove" | "rm" | "delete")
            if [ -z "${2:-}" ]; then
                error "No worktree name specified"
                usage
                exit 1
            fi
            remove_worktree "$2"
            ;;
        "prune" | "clean")
            prune_worktrees
            ;;
        *)
            # Branch name - parse flags
            branch="$1"

            # Check for --skip-init and --base flags
            local i=2
            while [ $i -le $# ]; do
                case "${!i}" in
                    --skip-init)
                        skip_init=true
                        ;;
                    --base)
                        i=$((i + 1))
                        if [ $i -le $# ]; then
                            base_branch="${!i}"
                        else
                            error "--base requires an argument"
                            exit 1
                        fi
                        ;;
                    *)
                        error "Unknown option: ${!i}"
                        usage
                        exit 1
                        ;;
                esac
                i=$((i + 1))
            done

            create_worktree "$branch" "$skip_init" "$base_branch"
            ;;
    esac
}

main "$@"

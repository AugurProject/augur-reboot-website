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
  ./scripts/worktree/main.sh claude/review-abc123              # Auto-strips 'claude/' prefix
  ./scripts/worktree/main.sh feature/ui --skip-init            # Create without initialization (faster)
  ./scripts/worktree/main.sh review-docs                       # Re-run init on existing worktree
  ./scripts/worktree/main.sh list                              # Show all worktrees
  ./scripts/worktree/main.sh remove feature-new-ui             # Remove worktree

Notes:
  - Worktrees are created in .worktree/ directory
  - Directory names automatically strip 'origin/', 'claude/', and other prefixes
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
# Strips: origin/, remotes/origin/, claude/, remotes/claude/
# Converts slashes to hyphens
normalize_branch_name() {
    local branch="$1"

    # Strip remote prefixes
    branch="${branch#remotes/}"
    branch="${branch#origin/}"
    branch="${branch#claude/}"
    branch="${branch#remotes/origin/}"
    branch="${branch#remotes/claude/}"

    # Convert slashes to hyphens for directory name
    branch="${branch//\//-}"

    echo "$branch"
}

# Check if branch exists (local or remote)
branch_exists() {
    local branch="$1"
    git rev-parse --verify "$branch" >/dev/null 2>&1
}

# Get the full branch reference
get_branch_ref() {
    local branch="$1"
    git rev-parse --verify "$branch" >/dev/null 2>&1 && echo "$branch" || echo ""
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

        # Fetch latest remote branches to ensure we have up-to-date refs
        info "Fetching latest remote branches..."
        git fetch --quiet origin || warning "Failed to fetch remote branches (continuing anyway)"

        # Strategy: Check remote first, then local, then create new
        # This ensures we always prefer remote branches over local ones
        local local_branch_name="$dir_name"
        local found_branch=""
        local branch_type=""

        # Step 1: Check if branch exists on remote (origin)
        # Handle different input formats:
        # - "claude/foo" -> check "origin/claude/foo"
        # - "origin/foo" -> check "origin/foo"
        # - "features/bar" -> check "origin/features/bar"
        local remote_candidate=""
        local clean_branch_name="$branch"

        # Build remote candidate first (before stripping prefixes)
        if [[ "$branch" == origin/* ]]; then
            remote_candidate="$branch"
            clean_branch_name="${branch#origin/}"
        elif [[ "$branch" == remotes/origin/* ]]; then
            remote_candidate="${branch#remotes/}"
            clean_branch_name="${branch#remotes/origin/}"
        else
            # For anything else (claude/foo, feature/bar, etc.), prepend origin/
            remote_candidate="origin/$branch"
            clean_branch_name="$branch"
        fi

        if branch_exists "$remote_candidate"; then
            found_branch="$remote_candidate"
            branch_type="remote"
            info "Found remote branch: $remote_candidate"
        # Step 2: Check if local branch exists
        elif branch_exists "$clean_branch_name"; then
            found_branch="$clean_branch_name"
            branch_type="local"
            info "Found local branch: $clean_branch_name"
        # Step 3: Branch doesn't exist - will create new from base
        else
            branch_type="new"
            info "Branch '$clean_branch_name' not found on remote or locally"
            info "Will create new branch from base"
        fi

        # Handle based on what we found
        if [ "$branch_type" = "remote" ]; then
            # Remote branch exists - create local tracking branch
            # Use clean branch name for local branch (strips origin/ prefix)
            local tracking_branch_name="${found_branch#origin/}"

            # Check if local tracking branch already exists
            if git rev-parse --verify "$tracking_branch_name" >/dev/null 2>&1; then
                info "Using existing local branch: $tracking_branch_name"
                # Just checkout the existing local branch
                if git worktree add "$worktree_path" "$tracking_branch_name"; then
                    # Check if tracking is already configured
                    local upstream=$(cd "$worktree_path" && git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")
                    if [ -z "$upstream" ]; then
                        info "Setting up tracking: $tracking_branch_name -> $found_branch"
                        (cd "$worktree_path" && git branch --set-upstream-to="$found_branch")
                    fi
                    success "Worktree created successfully!"
                    echo ""
                    info "Branch: $tracking_branch_name (tracking $found_branch)"
                    info "Location: $worktree_path"
                else
                    error "Failed to create worktree"
                    exit 1
                fi
            else
                # Create new local tracking branch
                info "Creating local tracking branch: $tracking_branch_name -> $found_branch"
                if git worktree add -b "$tracking_branch_name" "$worktree_path" "$found_branch"; then
                    # Set up tracking relationship
                    (cd "$worktree_path" && git branch --set-upstream-to="$found_branch")
                    success "Worktree created successfully!"
                    echo ""
                    info "Branch: $tracking_branch_name (tracking $found_branch)"
                    info "Location: $worktree_path"
                else
                    error "Failed to create worktree"
                    exit 1
                fi
            fi
        elif [ "$branch_type" = "local" ]; then
            # Local branch exists - just check it out
            info "Using existing local branch: $found_branch"
            if git worktree add "$worktree_path" "$found_branch"; then
                success "Worktree created successfully!"
                echo ""
                info "Branch: $found_branch"
                info "Location: $worktree_path"
            else
                error "Failed to create worktree"
                exit 1
            fi
        else
            # Branch doesn't exist - create new from base branch
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
            info "Creating new branch '$clean_branch_name' from: $base_branch"

            # Create the worktree with a new local branch using clean name
            info "Creating worktree at: $WORKTREE_DIR/$dir_name"
            if git worktree add -b "$clean_branch_name" "$worktree_path" "$branch_ref"; then
                success "Worktree created successfully!"
                echo ""
                info "Branch: $clean_branch_name (new branch from $base_branch)"
                info "Location: $worktree_path"
            else
                error "Failed to create worktree"
                exit 1
            fi
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

    # Get the branch name for this worktree
    local branch_name
    branch_name=$(cd "$worktree_path" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

    info "Removing worktree: $WORKTREE_DIR/$name"

    if git worktree remove "$worktree_path" --force; then
        success "Worktree removed successfully!"

        # Delete the local branch if it exists
        if [ -n "$branch_name" ] && [ "$branch_name" != "HEAD" ]; then
            info "Deleting local branch: $branch_name"
            if git branch -D "$branch_name" 2>/dev/null; then
                success "Local branch '$branch_name' deleted"
            else
                warning "Could not delete branch '$branch_name' (may not exist or already deleted)"
            fi
        fi

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

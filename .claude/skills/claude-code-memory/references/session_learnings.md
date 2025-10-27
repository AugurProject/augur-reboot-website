# Session Learnings Management

How to capture solutions and prevent Claude from repeating the same struggles.

## The Problem

During Claude Code sessions, Claude sometimes:
- Struggles with the same issue multiple times
- Tries approaches that failed before
- Misses solutions that worked in past sessions
- Repeats debugging cycles unnecessarily

**Root cause:** Each session starts fresh with no memory of past problem-solving.

## The Solution

Create a "learnings" knowledge base that documents:
- Problems Claude struggled with
- Solutions that eventually worked
- Context for when to apply each solution

Store these in `.claude/memory/learnings/` and reference them in `.claude/CLAUDE.md`.

## Directory Structure

```
.claude/memory/learnings/
├── build_issues.md           # Build/compilation problems
├── testing_issues.md         # Test setup and execution
├── deployment_issues.md      # Deployment and CI/CD
├── debugging_solutions.md    # Debugging techniques that worked
├── integration_issues.md     # Third-party integration problems
├── performance_solutions.md  # Performance optimization findings
├── tooling_issues.md        # Development tool problems
└── general_learnings.md     # Uncategorized learnings
```

## When to Capture a Learning

Capture when:
- ✅ Claude struggled for >3 attempts before finding solution
- ✅ The problem is project-specific (not general knowledge)
- ✅ The solution is non-obvious or counterintuitive
- ✅ You notice Claude making the same mistake again
- ✅ The issue cost significant time to resolve

Don't capture:
- ❌ General programming knowledge Claude should know
- ❌ One-time typos or mistakes
- ❌ Problems caused by temporary environment issues
- ❌ Issues that are well-documented elsewhere

## Capturing Methods

### Method 1: Interactive Script (Recommended)

Run the capture script in interactive mode:

```bash
python scripts/capture_learning.py
```

It will prompt you for:
1. Category (build, test, deploy, debug, etc.)
2. Title (short description)
3. Problem description
4. Solution that worked
5. Context (when to apply)

### Method 2: Manual Creation

Create/edit the appropriate file in `.claude/memory/learnings/`:

```markdown
## Python Import Errors with Local Modules

**Date:** 2024-10-27

**Problem:**
Claude repeatedly tried `import mypackage.module` but got ModuleNotFoundError,
even though the package structure was correct. Tried adding to sys.path,
using relative imports, etc.

**Solution:**
The project needs to be run as a module: `python -m mypackage.main`
Also ensure all directories have `__init__.py` files.

**Context/When to Apply:**
- When working with multi-file Python projects
- When imports work in the IDE but fail when running
- Before trying complex sys.path manipulations

---
```

### Method 3: Quick Scripted Capture

For automation or quick captures:

```bash
python scripts/capture_learning.py --quick \
  --category debug \
  --title "Python import error with local modules" \
  --problem "Could not import despite correct structure" \
  --solution "Use python -m module.main and add __init__.py files"
```

## Writing Effective Learnings

### Good Problem Descriptions

❌ **Bad:** "Import didn't work"
✅ **Good:** "Python ModuleNotFoundError when running script directly, even with correct package structure and __init__.py files"

❌ **Bad:** "Build failed"
✅ **Good:** "Docker build failed with 'no space left on device' despite 50GB free - caused by dangling build cache layers"

### Good Solution Descriptions

❌ **Bad:** "Fixed it"
✅ **Good:** "Run `docker system prune -a` to clear build cache, then rebuild. Add `--no-cache` flag if issue persists"

❌ **Bad:** "Changed the config"
✅ **Good:** "Updated webpack.config.js to use `resolve.fallback` for Node polyfills in browser environment"

### Adding Helpful Context

Include:
- **Prerequisites:** What needs to be in place
- **Indicators:** How to recognize when to use this solution
- **Trade-offs:** Any downsides or caveats
- **Related issues:** Links to similar problems

Example:
```markdown
**Context/When to Apply:**
- Applies to Docker builds on Mac/Windows (not Linux)
- Symptom: Build fails but `df -h` shows plenty of space
- Check first: `docker system df` shows high cache usage
- Trade-off: Removes all cached layers, next build will be slower
```

## Referencing Learnings in CLAUDE.md

In your main `.claude/CLAUDE.md`, add a section that references learnings:

```markdown
## Known Issues and Solutions

Before debugging, check these common issues:
- Build problems: See `.claude/memory/learnings/build_issues.md`
- Python imports: See `.claude/memory/learnings/debugging_solutions.md`
- Docker issues: See `.claude/memory/learnings/deployment_issues.md`

Or review all learnings: `.claude/memory/learnings/`
```

Alternatively, for critical issues, include inline:

```markdown
## Critical: Docker Build Issues

**Before debugging Docker builds**, note that we've encountered cache-related
failures that appear as "no space" errors. Solution: `docker system prune -a`

Full details: `.claude/memory/learnings/build_issues.md`
```

## Maintaining Learnings

### Regular Review (Monthly)

1. Check if learnings are still relevant
2. Update solutions if better approaches found
3. Consolidate similar issues
4. Remove obsolete entries (but consider archiving first)

### Updating Existing Learnings

When you find a better solution:

```markdown
## Title

**Date:** 2024-10-27
**Updated:** 2024-11-15

**Problem:**
[original problem]

**Solution (Updated):**
Originally used approach A, but discovered approach B is more reliable.

**Original approach:**
[keep for context]

**Better approach:**
[new solution]
```

### Archiving Old Learnings

When a learning becomes obsolete (e.g., upgraded dependencies, changed architecture):

1. Move to `.claude/memory/learnings/archive/`
2. Add date archived
3. Explain why it's obsolete
4. Keep for historical context

## Pattern: Learning → Convention

When a learning reveals a consistent pattern, promote it to a convention:

1. **Capture learning** initially in learnings/
2. **Notice pattern** appearing multiple times
3. **Extract principle** from specific instances
4. **Create convention** in `.claude/memory/conventions/`
5. **Reference** learning as example in convention

Example flow:
- Capture: "Fixed import issue by using python -m"
- Notice: This happened 3 times
- Extract: "Always run multi-file Python projects as modules"
- Convention: Add to `.claude/memory/conventions/python.md`

## Common Categories

### Build Issues
- Compilation errors
- Dependency problems
- Build tool configuration
- Cache problems

### Testing Issues
- Test setup and teardown
- Mock/fixture problems
- Test environment configuration
- Flaky test solutions

### Deployment Issues
- CI/CD pipeline problems
- Environment differences
- Configuration management
- Docker/container issues

### Debugging Solutions
- Techniques that worked
- Tool usage patterns
- Investigation approaches
- Common debugging mistakes

### Integration Issues
- API integration problems
- Third-party library quirks
- Authentication issues
- Rate limiting solutions

### Performance Solutions
- Optimization techniques discovered
- Profiling insights
- Caching strategies
- Query optimization

### Tooling Issues
- IDE setup problems
- Linter/formatter configuration
- Git workflow issues
- Developer tool quirks

## Tips for Success

1. **Capture immediately** - Don't wait until end of session
2. **Be specific** - Generic advice won't help future sessions
3. **Include commands** - Exact commands that worked
4. **Note symptoms** - How to recognize the problem
5. **Keep it searchable** - Use clear keywords in titles
6. **Cross-reference** - Link related learnings
7. **Update regularly** - Don't let learnings become stale
8. **Share patterns** - Promote common learnings to conventions

## Integration with Workflows

Learnings complement other memory workflows:

- **After debugging session** → Capture learning
- **During code review** → Check if learning should become convention
- **Monthly maintenance** → Review and update learnings
- **Project changes** → Update affected learnings
- **Quarterly review** → Promote patterns to conventions

## Example Learning Entry

```markdown
## Jest Tests Timing Out in CI

**Date:** 2024-10-15

**Problem:**
Jest tests run fine locally but timeout in CI after 5 seconds. Extended timeout
didn't help. Tests were async but properly using await.

**Solution:**
Issue was jest.useFakeTimers() in a test setup file without proper cleanup.
Added `afterEach(() => jest.useRealTimers())` to global test setup.

**Context/When to Apply:**
- Symptom: Tests timeout in CI but work locally
- Check: Look for jest.useFakeTimers() without cleanup
- Location: Often in test setup files (setupTests.js)
- Prevention: Always pair useFakeTimers with useRealTimers in cleanup

**Related:**
- See testing_issues.md for other async test problems
- See conventions/testing.md for timer usage guidelines

---
```

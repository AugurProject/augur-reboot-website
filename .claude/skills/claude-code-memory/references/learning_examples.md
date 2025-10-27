# Session Learnings Examples

Real examples of capturing learnings from Claude Code sessions.

## Example 1: Import Error That Was Hard to Debug

### Context
Claude tried multiple approaches to fix a Python import error over several attempts:
1. Tried relative imports - didn't work
2. Modified sys.path - didn't work  
3. Restructured package - didn't work
4. Finally discovered needed to run as module

### Captured Learning

```markdown
## Python Import Errors with Local Modules

**Date:** 2024-10-27

**Problem:**
Claude repeatedly tried different import approaches for a multi-file Python 
project. `import mypackage.module` gave ModuleNotFoundError even though:
- Package structure was correct
- __init__.py files existed
- Imports worked in IDE
- Added to sys.path manually

**Solution:**
The project needs to be run as a module using: `python -m mypackage.main`

This tells Python to treat the directory as a package. Also ensure:
- All directories have __init__.py files (even if empty)
- Run from project root directory
- Don't use relative imports if running as module

**Context/When to Apply:**
- Symptom: Imports work in IDE but fail when running script
- Applies to: Multi-file Python projects with package structure
- Try this before: Complex sys.path manipulations
- Related: See conventions/python.md for project structure guidelines

---
```

### How This Prevents Future Issues

Next time Claude encounters import errors in this project:
1. Claude reads `.claude/memory/learnings/debugging_solutions.md`
2. Recognizes the symptoms (imports work in IDE but fail when running)
3. Immediately tries `python -m package.main` instead of wasting time
4. Avoids repeating the same failed approaches

## Example 2: Docker Build Cache Issue

### Context
Docker builds kept failing with "no space left on device" even though disk had 
50GB free. Claude tried several things before finding the cache issue.

### Captured Learning

```markdown
## Docker "No Space" Error Despite Free Disk

**Date:** 2024-10-27

**Problem:**
Docker build fails with "no space left on device" error, but `df -h` shows 
plenty of disk space available (e.g., 50GB free). Claude tried:
- Removing containers
- Removing images
- Checking disk space in different ways
- Restarting Docker

**Solution:**
The issue is dangling build cache layers. Run:
```bash
docker system df  # Check cache usage
docker system prune -a  # Clear all build cache
```

If issue persists during build, add `--no-cache` flag:
```bash
docker build --no-cache -t myimage .
```

**Context/When to Apply:**
- Symptom: Build fails with "no space" but disk isn't full
- Most common on: Mac and Windows Docker Desktop
- Check first: Run `docker system df` to see cache usage
- Trade-off: Next build will be slower (rebuilds all layers)
- Prevention: Periodically run `docker system prune`

**Related:**
- See deployment_issues.md for other Docker problems
- See workflows/deployment.md for build procedures

---
```

## Example 3: Async Test Timing Out

### Context
Tests worked locally but timed out in CI. Claude tried increasing timeout, 
checking async/await, examining CI environment before finding the real issue.

### Captured Learning

```markdown
## Jest Tests Timeout in CI But Not Locally

**Date:** 2024-10-27

**Problem:**
Jest async tests run fine locally (< 1 second) but timeout in CI after 5 
seconds. Tests properly use async/await. Extending timeout didn't help.

Tried:
- Increasing jest timeout
- Checking for missing await
- Looking at CI environment differences
- Adding more logging

**Solution:**
Found `jest.useFakeTimers()` in setupTests.js without cleanup. This causes 
timers to never advance in subsequent tests.

Fix: Add cleanup in setupTests.js:
```javascript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();  // This was missing!
  jest.clearAllTimers();
});
```

Or better, only use fake timers in specific tests that need them.

**Context/When to Apply:**
- Symptom: Tests timeout in CI but work locally
- Check: Search for `useFakeTimers` without matching `useRealTimers`
- Location: Often in test setup files (setupTests.js, jest.config.js)
- Prevention: Always pair useFakeTimers with useRealTimers cleanup
- Best practice: Use fake timers only in tests that need them

**Related:**
- See testing_issues.md for other async test problems
- See conventions/testing.md for timer usage guidelines

---
```

## When to Reference in CLAUDE.md

For frequent/critical issues, reference learnings in main CLAUDE.md:

```markdown
# Project Context

## Known Issues - Check First!

Before debugging these common issues, check learnings:

**Python imports failing:**
See `.claude/memory/learnings/debugging_solutions.md` - "Python Import Errors"

**Docker build issues:**
See `.claude/memory/learnings/deployment_issues.md` - look for space/cache issues

**Tests timeout in CI:**
See `.claude/memory/learnings/testing_issues.md` - check for timer cleanup issues

**All learnings:** `.claude/memory/learnings/`
```

## Tips for Effective Learning Capture

1. **Capture right after solving** - Don't wait, details fade quickly
2. **Include what didn't work** - Helps Claude avoid same dead ends
3. **Be specific about symptoms** - "Imports fail when running script" not "imports broken"
4. **Give exact commands** - `python -m package.main` not "run as module"
5. **Add context** - When does this apply? What are the trade-offs?
6. **Cross-reference** - Link to related conventions, decisions, workflows
7. **Update if better solution found** - Learnings evolve as project does

## Converting Learnings to Conventions

When a learning reveals a consistent pattern, promote it:

**Learning** (specific incident):
```markdown
## Fixed Import Error by Running as Module
Claude struggled with imports, eventually found need to run `python -m ...`
```

**→ Becomes Convention** (general rule):
```markdown
# Python Conventions

## Project Structure
- Always run multi-file Python projects as modules: `python -m package.main`
- Don't run files directly with `python package/main.py`
- Ensures proper import resolution

See `.claude/memory/learnings/debugging_solutions.md` for original issue.
```

The learning stays as historical context, convention becomes the go-to reference.

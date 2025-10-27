# Memory Maintenance Workflows

Step-by-step workflows for maintaining Claude Code memory hygiene.

## Workflow 1: Initial Memory Audit

**When to use:** Starting work on a project, or first time reviewing memory

**Steps:**
1. Run audit script: `python scripts/audit_memory.py`
2. Review the report for stale files, large files, organization issues
3. Create a prioritized list of issues to address
4. Execute appropriate cleanup workflows below

## Workflow 2: Stale Content Review

**When to use:** Files haven't been updated in 60+ days, or project direction changed

**Steps:**
1. Identify stale files (use audit script)
2. For each stale file, determine:
   - **Still relevant?** → Update with current information
   - **Partially relevant?** → Extract relevant parts, archive rest
   - **Obsolete?** → Delete or move to archive
3. Add "Last reviewed: YYYY-MM-DD" to updated files
4. Update any references in CLAUDE.md

**Example review questions:**
- Is this architecture still current?
- Have these conventions changed?
- Is this decision still in effect?
- Do these instructions still apply?

## Workflow 3: Redundancy Consolidation

**When to use:** Finding duplicate information, overlapping content

**Steps:**
1. Identify redundant content (similar topics across files)
2. Choose canonical location (most logical home)
3. Consolidate information into canonical file
4. Replace redundant content with references: "See X.md for details"
5. Delete truly redundant files
6. Update cross-references

**Consolidation patterns:**
- Multiple architecture docs → Single architecture directory with focused files
- Scattered conventions → conventions/code_style.md
- Repeated workflow notes → workflows/ directory

## Workflow 4: Large File Splitting

**When to use:** Files exceed 500-1000 lines or cover multiple distinct topics

**Steps:**
1. Identify logical split points (distinct topics/sections)
2. Create new focused files for each topic
3. Extract content to new files
4. Add cross-references between files
5. Create index file if needed
6. Update CLAUDE.md references

**Example splits:**
- `api.md` (3000 lines) →
  - `architecture/api_design.md` (design principles)
  - `architecture/api_endpoints.md` (endpoint reference)
  - `conventions/api_patterns.md` (coding patterns)

## Workflow 5: Conflict Resolution

**When to use:** Finding contradictory information across files

**Steps:**
1. Identify conflicting statements
2. Determine which is current/correct
3. Update or remove outdated information
4. Add clarifying context if needed
5. Consider consolidating related content to prevent future conflicts

**Common conflicts:**
- Old vs new architecture decisions
- Deprecated vs current conventions
- Different team members' notes

## Workflow 6: Project Context Update

**When to use:** Major project changes, new features, refactors

**Steps:**
1. Review affected memory files
2. Update technical details (architecture, APIs, etc.)
3. Add new decisions/conventions if needed
4. Archive superseded information
5. Update timestamps and "last reviewed" dates
6. Verify CLAUDE.md still references correctly

**Triggers for updates:**
- Major refactoring completed
- New service/component added
- Technology stack changes
- Team conventions change
- Deployment process updates

## Workflow 7: Regular Maintenance Schedule

**When to use:** Ongoing project work

**Recommended schedule:**

**Weekly (5-10 min):**
- Quick scan for outdated TODOs
- Update any changed conventions
- Add new decisions/patterns as they emerge

**Monthly (20-30 min):**
- Run audit script
- Review stale files
- Consolidate any accumulated redundancy
- Update project_overview.md

**Quarterly (1-2 hours):**
- Deep review of all memory files
- Major reorganization if needed
- Archive historical decisions
- Validate all cross-references

## Workflow 8: Memory Migration

**When to use:** Moving to memory system for first time, or restructuring

**Steps:**
1. Create `.claude/memory/` directory
2. Create basic structure (architecture/, conventions/, etc.)
3. Extract relevant information from:
   - Existing comments in code
   - Project documentation
   - Past chat contexts
   - README files
4. Organize into memory files by topic
5. Create project_overview.md as entry point
6. Update CLAUDE.md to reference memory files
7. Run audit to verify structure

## Workflow 9: Capture Session Learnings

**When to use:** After Claude struggled with an issue and found a solution

**Steps:**
1. Identify the problem Claude struggled with (>3 attempts)
2. Document what finally worked
3. Use capture script or manual creation:
   ```bash
   python scripts/capture_learning.py
   ```
4. Choose appropriate category (build, test, debug, etc.)
5. Write clear problem description with symptoms
6. Document solution with exact commands/code
7. Add context about when to apply
8. Optionally reference in CLAUDE.md if critical

**Quick capture:**
```bash
python scripts/capture_learning.py --quick \
  --category debug \
  --title "Brief description" \
  --problem "What Claude struggled with" \
  --solution "What finally worked"
```

**When it's worth capturing:**
- Problem took >3 attempts to solve
- Solution was non-obvious
- Problem is project-specific
- Likely to recur in future sessions

**Categories:**
- `build` - Compilation, build tool issues
- `test` - Testing setup and execution
- `deploy` - Deployment and CI/CD
- `debug` - Debugging techniques
- `integration` - Third-party integrations
- `performance` - Performance optimizations
- `tooling` - Development tool problems
- `general` - Other learnings

See `references/session_learnings.md` for detailed guidance on writing effective learnings.

## Workflow 10: Promote Learning to Convention/Architecture

**When to use:** Learning reveals a pattern that should be standard practice

**Triggers:**
- Same learning applies 2-3+ times
- Realized this is how things should be done project-wide
- Learning reveals need for architectural decision

**Steps:**

### Option A: Promote to Convention
1. Review the learning - identify the underlying pattern/principle
2. Determine if pattern applies project-wide
3. Check if convention file exists for domain (e.g., conventions/python.md)
4. Create or update convention file with:
   - Clear rule statement
   - Rationale
   - Reference to original learning as example
5. Update learning to reference convention
6. Update CLAUDE.md if convention is critical

**Template:**
```markdown
# conventions/{domain}.md

## {Convention Name}

**Rule:** {Clear statement of what to do}

**Rationale:** {Why this is the right approach}

**Example:** See learnings/{file}.md for original issue
```

### Option B: Promote to Architecture
1. Recognize learning points to missing/wrong architecture
2. Document architectural decision in architecture/
3. Archive or update learning with reference
4. Update CLAUDE.md to reference architecture doc

### Option C: Promote to Decision (ADR)
1. Recognize this represents a significant choice with alternatives
2. Create decision doc with date (YYYY-MM-DD-{title}.md)
3. Document alternatives considered and rationale
4. Keep learning as context/example
5. Cross-reference in both docs

**Example promotion flow:**

**Learning (captured):**
```markdown
## Python Import Error with Local Modules
Problem: Imports failed when running directly
Solution: Use python -m package.main
```

**After pattern recognized → Convention:**
```markdown
# conventions/python.md
## Project Execution
Always run multi-file Python projects as modules:
`python -m mypackage.main`

See learnings/debugging_solutions.md for original issue.
```

**Update learning:**
```markdown
## Python Import Error with Local Modules
...
**Resolution:** This is now standard practice.
See conventions/python.md for project convention.
```

**Promotion criteria:**
- Learning → Convention: Pattern applies 2-3+ times OR clearly the right way
- Learning → Architecture: Reveals structural design need
- Learning → Decision: Significant choice between alternatives with trade-offs

See `references/memory_lifecycle.md` for complete lifecycle framework.

## Quick Reference: Decision Tree

```
Memory issue detected
│
├─ File too large (>1000 lines)?
│  └─ → Use Workflow 4: Large File Splitting
│
├─ Information outdated (>60 days)?
│  └─ → Use Workflow 2: Stale Content Review
│
├─ Duplicate content across files?
│  └─ → Use Workflow 3: Redundancy Consolidation
│
├─ Conflicting information?
│  └─ → Use Workflow 5: Conflict Resolution
│
├─ Major project change?
│  └─ → Use Workflow 6: Project Context Update
│
└─ Starting fresh or routine check?
   └─ → Use Workflow 1: Initial Memory Audit
```

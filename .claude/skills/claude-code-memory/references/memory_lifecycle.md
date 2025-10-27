# Memory Lifecycle: From Learnings to Conventions

Clear framework for when information moves between memory types.

## Memory Type Definitions

### Learnings (`.claude/memory/learnings/`)
**Purpose:** Troubleshooting and gotchas - prevent repeating struggles
**Lifecycle:** Temporary to permanent, depending on type
**Examples:**
- "Docker cache causes 'no space' errors - run docker system prune"
- "Jest tests timeout in CI due to useFakeTimers without cleanup"
- "Python imports fail - need to run with python -m"

### Conventions (`.claude/memory/conventions/`)
**Purpose:** Established patterns and standards for this project
**Lifecycle:** Permanent until project changes
**Examples:**
- "Always run Python projects as modules: python -m package.main"
- "Use Jest fake timers only in specific tests, not globally"
- "API endpoints follow REST conventions: /api/v1/resource/{id}"

### Architecture (`.claude/memory/architecture/`)
**Purpose:** Structural decisions and system design
**Lifecycle:** Permanent until major refactor
**Examples:**
- "Using PostgreSQL for relational data, Redis for caching"
- "Microservices communicate via message queue (RabbitMQ)"
- "Frontend: React SPA, Backend: FastAPI REST API"

### Decisions (`.claude/memory/decisions/`)
**Purpose:** Key choices made and their rationale (ADRs)
**Lifecycle:** Historical record, rarely deleted
**Examples:**
- "2024-10-20: Chose PostgreSQL over MongoDB for ACID compliance"
- "2024-11-15: Migrated from REST to GraphQL for flexible queries"

## Decision Framework: Where Does Information Go?

```
Is this a troubleshooting tip or gotcha?
├─ YES → Learnings (at least initially)
└─ NO ↓

Is this a pattern/standard we've decided to follow?
├─ YES → Conventions
└─ NO ↓

Is this a structural/design decision?
├─ YES → Architecture
└─ NO ↓

Is this a significant choice with rationale?
├─ YES → Decisions
└─ NO → Maybe doesn't need to be in memory
```

## Lifecycle States

### State 1: Initial Capture (Learnings)
**Trigger:** Claude struggled with something, found solution
**Action:** Capture in learnings/
**Duration:** Keep until you understand if it's a pattern

**Example:**
```markdown
## Python Import Error with Local Modules
**Problem:** Imports failed when running script directly
**Solution:** Used python -m package.main instead
```

### State 2: Pattern Recognition
**Trigger:** Same issue appears 2-3 times, or you recognize it's fundamental
**Action:** Evaluate for promotion

**Questions to ask:**
- Is this a one-time gotcha or a systematic pattern?
- Does this apply project-wide or was it situational?
- Is this how we want to do things going forward?

### State 3A: Promote to Convention
**When:** Learning reveals a pattern we should follow consistently
**Action:** 
1. Create/update convention file
2. Keep learning as example/reference
3. Cross-reference between them

**Example:**
```markdown
# conventions/python.md

## Project Structure and Execution

**Always run multi-file Python projects as modules:**
```bash
python -m mypackage.main
```

**Rationale:** Ensures proper import resolution and package structure.

**Example issue:** See learnings/debugging_solutions.md - "Python Import Error"
```

Learning stays in learnings/ but now references the convention:
```markdown
## Python Import Error with Local Modules
...
**Resolution:** This is now standard practice. 
See conventions/python.md for details.
```

### State 3B: Keep as Learning
**When:** It's a troubleshooting tip, not a pattern to follow
**Action:** Keep in learnings/, maybe add to troubleshooting index

**Example:** Docker cache issue - this is a fix when things go wrong, not a standard practice

### State 3C: Promote to Architecture
**When:** Learning reveals we need a structural decision
**Action:**
1. Create architecture doc
2. Archive or remove learning
3. Reference in architecture doc

**Example:** After multiple struggles with state management, realize need Redux
- Remove learning about specific state bugs
- Create architecture/state-management.md explaining Redux choice

### State 3D: Promote to Decision (ADR)
**When:** Learning represents a significant choice with rationale
**Action:**
1. Create decision doc with date
2. Document alternatives considered
3. Keep learning as example of problem

**Example:**
Learning about monorepo tooling issues → Decision to adopt monorepo structure

## Promotion Workflows

### Workflow: Learning → Convention

**Trigger:** Realized this should be standard practice

**Steps:**
1. Identify the pattern/principle from the learning
2. Check if convention file exists for this domain
3. Add to conventions/ with clear rule and rationale
4. Update learning to reference convention
5. Update CLAUDE.md if convention is critical

**Template:**
```markdown
# conventions/{domain}.md

## {Convention Name}

**Rule:** {Clear statement of what to do}

**Rationale:** {Why this is the right approach}

**Example:** See learnings/{file}.md for original issue

**Exceptions:** {Any cases where this doesn't apply}
```

### Workflow: Learning → Architecture

**Trigger:** Learning reveals need for architectural decision

**Steps:**
1. Recognize the learning points to missing/wrong architecture
2. Make the architectural decision
3. Document in architecture/
4. Remove or archive the learning
5. Reference learning as motivating example if relevant

### Workflow: Learning → Decision (ADR)

**Trigger:** Learning represents significant choice between alternatives

**Steps:**
1. Write formal decision record with date
2. Document alternatives considered
3. Explain rationale and trade-offs
4. Keep learning as context/example
5. Cross-reference decision in learning

**Template:**
```markdown
# decisions/YYYY-MM-DD-{title}.md

## Decision: {Title}

**Date:** YYYY-MM-DD

**Context:** {What problem led to this decision}

**Alternatives Considered:**
1. Option A - {pros/cons}
2. Option B - {pros/cons}

**Decision:** {What we chose}

**Rationale:** {Why we chose it}

**Consequences:** {Impact of this decision}

**Related:** See learnings/{file}.md for original problem
```

## Duplication Prevention

### Rule 1: One Source of Truth
Information should primarily live in ONE place:
- If it's a convention → conventions/
- If it's troubleshooting → learnings/
- Never duplicate full content

### Rule 2: Cross-Reference Liberally
```markdown
# learnings/debugging_solutions.md
## Python Import Issue
...
**Note:** This is now standard practice.
See conventions/python.md for project convention.
```

```markdown
# conventions/python.md
## Module Execution
...
**Background:** Originally discovered while debugging imports.
See learnings/debugging_solutions.md for original issue.
```

### Rule 3: Update on Promotion
When promoting, update the learning to point to new location:
- ✅ Keep learning with reference to convention
- ✅ Or archive learning if fully superseded
- ❌ Don't delete learning without archiving

## Review Cadence

### Weekly (During Active Development)
- Capture learnings as they happen
- Don't worry about promotion yet

### Monthly (Maintenance Review)
- Review learnings captured this month
- Identify patterns (appeared 2+ times?)
- Promote clear patterns to conventions
- Keep genuine troubleshooting tips as learnings

### Quarterly (Deep Review)
- Review all learnings
- Promote consistent patterns to conventions
- Archive obsolete learnings
- Consolidate related conventions
- Ensure no duplication between learnings/conventions

## Quick Decision Guide

**Capture as Learning when:**
- ✅ Claude struggled to solve it
- ✅ Solution is non-obvious
- ✅ Might be one-time issue
- ✅ Need to prevent repetition

**Promote to Convention when:**
- ✅ Pattern appeared 2-3+ times
- ✅ This is how we want to do things
- ✅ Applies project-wide
- ✅ Should be proactive, not reactive

**Promote to Architecture when:**
- ✅ Learning reveals structural need
- ✅ System design decision
- ✅ Affects multiple components

**Promote to Decision when:**
- ✅ Significant choice with trade-offs
- ✅ Considered alternatives
- ✅ Want historical record of why

## Examples of Each Path

### Learning That Stays Learning
```markdown
## Docker "No Space" Error
Problem: Build fails with no space despite free disk
Solution: docker system prune -a
```
**Why it stays:** Troubleshooting tip, not a standard practice

### Learning → Convention
```markdown
Learning: "Had to use python -m to fix imports"
↓
Convention: "Always run Python projects as modules"
```
**Why promoted:** This is the right way to do it project-wide

### Learning → Architecture
```markdown
Learning: "State management bugs keep appearing"
↓
Architecture: "Use Redux for predictable state management"
```
**Why promoted:** Structural decision about system design

### Learning → Decision
```markdown
Learning: "Struggled with monorepo tooling"
↓
Decision: "2024-10-27: Adopt Nx monorepo structure"
```
**Why promoted:** Significant choice with alternatives considered

## Anti-Patterns to Avoid

❌ **Duplicate content** - Don't copy learning text into conventions
❌ **Premature promotion** - Don't promote after one occurrence
❌ **Forgetting to cross-reference** - Always link related docs
❌ **Deleting learnings** - Archive instead, keeps context
❌ **Generic conventions** - "Write good code" isn't helpful
❌ **Obsolete conventions** - Update when project changes

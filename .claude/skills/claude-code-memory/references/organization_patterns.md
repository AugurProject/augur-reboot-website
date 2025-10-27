# Memory Organization Patterns

Best practices for organizing Claude Code memory files in `.claude/memory/`.

## Directory Structure

Recommended organization:

```
.claude/
├── CLAUDE.md                    # Main context file (references memory files)
└── memory/                      # All memory files go here
    ├── project_overview.md      # High-level project context
    ├── architecture/            # Architecture decisions and patterns
    │   ├── database.md
    │   ├── api_design.md
    │   └── frontend.md
    ├── conventions/             # Code style and naming conventions
    │   ├── code_style.md
    │   └── api_patterns.md
    ├── decisions/               # ADRs and key decisions
    │   ├── 2024-10-auth.md
    │   └── 2024-11-deployment.md
    └── workflows/               # Process and workflow documentation
        ├── deployment.md
        └── testing.md
```

## File Naming Conventions

- Use lowercase with hyphens: `api-design.md`
- Include dates for time-sensitive content: `2024-10-migration.md`
- Be specific: `auth-implementation.md` not `auth.md`
- Avoid generic names: `user-service-api.md` not `api.md`

## Content Guidelines

### Keep It Current
- Date-stamp time-sensitive information
- Remove or archive outdated decisions
- Update when project direction changes

### Be Concise
- Each file should serve a clear purpose
- Aim for 200-500 lines per file
- Split large files by topic

### Avoid Redundancy
- Don't duplicate information across files
- Use references: "See architecture/database.md for schema details"
- Consolidate related information

### Prioritize Information
Structure files with most important info first:
1. Current state / key facts
2. Context and rationale
3. Details and examples
4. Historical notes (at end)

## What to Include

**DO include:**
- Architecture decisions and rationale
- Project-specific conventions
- Complex business logic
- Key dependencies and their purposes
- Deployment procedures
- Common pitfalls and solutions

**DON'T include:**
- General programming knowledge
- Library documentation (link instead)
- Temporary notes and TODOs (use separate file)
- Verbose explanations of obvious things

## Referencing Memory in CLAUDE.md

In your `.claude/CLAUDE.md`, reference memory files clearly:

```markdown
# Project Context

For detailed information, see:
- Architecture: `.claude/memory/architecture/`
- Code conventions: `.claude/memory/conventions/code_style.md`
- Deployment: `.claude/memory/workflows/deployment.md`
```

## Memory Lifecycle

1. **Create** - When starting or when patterns emerge
2. **Update** - As project evolves (weekly/monthly reviews)
3. **Consolidate** - When files grow large or overlap
4. **Archive** - Move outdated but historically useful content
5. **Delete** - Remove truly obsolete information

## Red Flags

Watch for these signs of poor memory hygiene:
- Files over 1000 lines
- No updates in 60+ days on active projects
- Duplicate information across files
- Conflicting information
- Generic filenames (temp.md, notes.md)
- Root directory cluttered with 5+ files

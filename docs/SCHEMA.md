# Docs Schema

> Instructions for maintaining this project's documentation. Read before writing or editing docs.

## What lives here

`docs/` is the persistent knowledge layer for the Augur Reboot Website. It covers:

- **Features**: design decisions, file layouts, authoring guides (blog, FAQ)
- **Architecture**: component hierarchy, state management, build system
- **Protocol reference**: Augur v2 mechanics, Lituus oracle, fork risk
- **Whitepaper summaries**: distilled knowledge from source papers

Docs are written for agents and contributors who need to understand or modify a system. They are not user-facing.

## Directory layout

```
docs/
├── SCHEMA.md                                # This file
├── INDEX.md                                 # Content catalog — start here
├── *.md                                     # Feature, system, and summary docs
└── raw/
    └── *.pdf                               # Original source papers (immutable)
```

## Writing conventions

- **Filenames:** lowercase, hyphenated. Must match the wikilink reference. Exception: `INDEX.md` is capitalized as the docs entry point.
- **Frontmatter:** light YAML — `title` (required), `tags` (list, optional). Placed at the top of every knowledge page.

  `INDEX.md` and `SCHEMA.md` are operating instructions for the documentation block, not knowledge pages. They intentionally do not use frontmatter.

  ```yaml
  ---
  title: Fork Risk Monitoring System
  tags: [fork-risk, github-actions, monitoring]
  ---
  ```

- **Cross-references:** `[[page-name]]` Obsidian-compatible wikilinks using filename without `.md`.
- **No fixed template:** page structure varies by content type. Let the content dictate the shape.

### Formatting

- **Tables** for structured comparisons and key-value summaries
- **Code blocks** for file paths, CLI commands, and data flow diagrams
- **Bold** for filenames, component names, and important constraints
- **Blockquotes** for notes, warnings, and source attributions

### Source whitepapers

PDFs in `raw/` are immutable — never modify them. Summary docs (`*-summary.md`) are derived knowledge distilled from these sources. Always attribute the source paper at the top of a summary.

## Operations

### Create a doc

1. Write the doc following the conventions above
2. Add an entry to `INDEX.md` with a one-line "When to Read" description
3. Stage and commit together

### Update a doc

1. Edit the doc
2. Check if `INDEX.md` description is still accurate — update if needed
3. Stage and commit together

### Remove a doc

1. Delete the file
2. Remove its entry from `INDEX.md`
3. Stage and commit together

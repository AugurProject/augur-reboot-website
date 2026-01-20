# Tailwind v4 Canonical Validator

A hybrid agent skill + PostToolUse hook system for validating and auto-fixing Tailwind CSS v4 class names.

## Features

### 1. Agent Skill Reference
Query the agent skill directly for canonical class information:
- Quick lookup of deprecated → canonical mappings
- Detailed explanations of why v4 changed certain utilities
- Category-organized reference (flex, opacity, shadow, etc.)

### 2. Automatic Validation & Fixing
PostToolUse hook automatically:
- Detects modified component files after each edit
- Scans for deprecated Tailwind v4 patterns
- Auto-fixes violations with canonical forms
- Reports what was fixed

## Supported Transformations

### High Priority (Most Common)
- Flex utilities: `flex-shrink-0` → `shrink-0`, `flex-grow` → `grow`
- Scale updates: `shadow-sm` → `shadow-xs`, `rounded-sm` → `rounded-xs`
- CSS variables: `bg-[--color]` → `bg-(--color)`

### Medium Priority
- Opacity modifiers: `bg-opacity-50 bg-red-500` → `bg-red-500/50`
- Gradients: `bg-gradient-to-r` → `bg-linear-to-r`
- Outlines: `outline outline-2` → `outline-2`
- Ring width: `ring` → `ring-3`
- Important position: `!flex` → `flex!`

### Low Priority (Less Common)
- Semantic renames: `overflow-ellipsis` → `text-ellipsis`
- Box decoration: `decoration-slice` → `box-decoration-slice`

## Usage

### As Agent Skill (Manual Reference)
Ask Claude directly for canonical class information:

```
"Is flex-shrink-0 canonical in Tailwind v4?"
"What's the new syntax for bg-opacity-50?"
"Show me all the scale changes in v4"
```

The skill provides:
- Quick lookup tables for each category
- Explanation of why each change was made
- Context about when to use each transformation

### Automatic Validation & Fixing (Hook)
Just edit your components normally. After you save an edit to a `.tsx`, `.jsx`, `.astro`, or `.css` file:

1. The PostToolUse hook automatically runs validation
2. Any deprecated patterns are detected
3. Files are auto-fixed with canonical forms
4. Console shows what was fixed

Example output:
```
✅ Tailwind v4 Validator: Fixed 3 deprecated patterns in ComponentName.tsx
  flex: "flex-shrink-0" → "shrink-0"
  shadow: "shadow-sm" → "shadow-xs"
  outline: "outline-none" → "outline-hidden"
```

## Implementation Details

### Pattern Database (`patterns.json`)
All patterns stored as a JSON array with:
- `id`: Unique identifier (e.g., "flex-shrink")
- `category`: Type of utility (e.g., "flex", "shadow")
- `deprecated`: Old v3 pattern
- `canonical`: New v4 form
- `explanation`: Why it changed
- `priority`: Processing order (1-3, lower = higher priority)
- `examples`: Before/after examples
- `isRegex`: Whether pattern uses regex matching
- `transform`: Custom transform type if applicable

### Validation Logic (`validate.ts`)
Three exported functions:
- `loadPatterns()`: Loads and sorts patterns from JSON by priority
- `validateClassString(code, patterns)`: Scans code for violations, returns array of detected issues
- `fixViolations(content, violations)`: Applies all fixes to code, returns corrected content

### Hook Integration (`.claude/hooks/post-tool-use/tailwind-v4-validator.ts`)
PostToolUse hook that:
- Triggers on Edit tool operations
- Filters for relevant file types (.tsx, .jsx, .astro, .css)
- Dynamically imports validation functions
- Auto-fixes files that contain violations
- Reports changes to console with specific rule information

## How It Works

### Processing Flow

1. **Edit File** → 2. **Hook Triggered** → 3. **Load Patterns** → 4. **Validate Code** → 5. **Apply Fixes** → 6. **Write File** → 7. **Report Results**

### Pattern Priority System
- **Priority 1**: Most frequent and important transformations (flex, scale updates, CSS variables)
- **Priority 2**: Important but secondary patterns (opacity, gradients, outlines)
- **Priority 3**: Edge cases and semantic improvements

Patterns are processed in priority order, ensuring the most critical fixes apply first.

## Testing

The skill includes a comprehensive test suite covering:
- Pattern loading and sorting
- Violation detection for all pattern types
- Transformation and fixing logic
- Edge cases (empty files, multiple violations, canonical classes)
- Multiple file types

Run tests:
```bash
npm test -- .claude/skills/tailwind-v4-validator/__tests__
```

Expected: All tests passing

## Supported File Types

The hook validates and fixes:
- `.tsx` - React TypeScript components
- `.jsx` - React JavaScript components
- `.astro` - Astro components
- `.css` - CSS files

Only files modified via the Edit tool are processed.

## Troubleshooting

### "Tailwind v4 Validator: Failed to load validation module"
- Ensure the skill is installed at `.claude/skills/tailwind-v4-validator/`
- Check that `patterns.json` exists and is valid JSON
- Check that `validate.ts` exists

### Hook not running on my edits
- Verify you're editing a `.tsx`, `.jsx`, `.astro`, or `.css` file
- Check `.claude/settings.json` that the hook is enabled
- Check console for error messages

### A transformation seems wrong
1. Check `patterns.json` for the rule
2. Review examples in the rule to understand the transformation
3. Check `validate.ts` for special handling of that rule
4. Temporarily disable hook in `.claude/settings.json` if you need to debug

### Too many false positives
- Check that `className` or `class=` attributes contain the deprecated pattern
- The validator only checks lines with className attributes
- Comments and string literals outside JSX should not trigger violations

## Future Enhancements

- [ ] Cache compiled regex patterns for performance
- [ ] Support arbitrary value validation
- [ ] Configuration: per-project pattern overrides
- [ ] IDE integration: inline violation reporting
- [ ] Batch validation: scan entire project before fix
- [ ] Whitelist: exclude specific files from validation

## Architecture Diagram

```
Edit File (.tsx/.jsx/.astro/.css)
          ↓
PostToolUse Hook Triggers
          ↓
Load Patterns (patterns.json)
          ↓
Validate Code (detect violations)
          ↓
Apply Fixes (transform violations)
          ↓
Write Fixed File
          ↓
Report Results (console output)
```

## Files

- **patterns.json** - Database of all v4 transformation rules
- **SKILL.md** - Quick reference guide for agent usage
- **validate.ts** - Core validation and transformation logic
- **README.md** - This file, documentation and architecture
- **__tests__/validate.test.ts** - Comprehensive test suite

# Tailwind v4 Canonical Validator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Create a hybrid agent skill + PostToolUse hook system that helps Claude write canonical Tailwind v4 classes and automatically fixes violations in modified files.

**Architecture:**
- **Agent Skill** (`tailwind-v4-validator`): Provides validation and reference capabilities for Claude during development
- **PostToolUse Hook**: Automatically validates modified files after edits and applies fixes
- **Pattern Database**: Centralized JSON file with all v4 canonical transformation rules, indexed by category
- **Tests**: Validation logic testing to ensure pattern matching and transformations work correctly

**Tech Stack:** TypeScript, JSON, Claude Code agents/hooks, ripgrep for file scanning

---

## Task 1: Create Pattern Database

**Files:**
- Create: `.claude/skills/tailwind-v4-validator/patterns.json`

**Step 1: Write the pattern database structure**

Create `.claude/skills/tailwind-v4-validator/patterns.json` with this structure (based on REFERENCE.md):

```json
{
  "patterns": [
    {
      "id": "flex-shrink",
      "category": "flex",
      "deprecated": "flex-shrink-0",
      "canonical": "shrink-0",
      "explanation": "Tailwind v4 simplified flex utilities by removing 'flex-' prefix",
      "examples": [
        { "old": "flex-shrink-0", "new": "shrink-0" },
        { "old": "flex-shrink-1", "new": "shrink-1" }
      ],
      "priority": 1
    },
    {
      "id": "flex-grow",
      "category": "flex",
      "deprecated": "flex-grow",
      "canonical": "grow",
      "explanation": "Tailwind v4 simplified flex utilities by removing 'flex-' prefix",
      "examples": [
        { "old": "flex-grow", "new": "grow" },
        { "old": "flex-grow-0", "new": "grow-0" }
      ],
      "priority": 1
    },
    {
      "id": "opacity-modifier",
      "category": "opacity",
      "deprecated": "(bg|text|border|divide|ring|placeholder)-opacity-(\\d+)\\s+(bg|text|border|divide|ring|placeholder)-",
      "canonical": null,
      "explanation": "Tailwind v4 replaced separate opacity utilities with slash notation (e.g., bg-red-500/50)",
      "examples": [
        { "old": "bg-opacity-50 bg-red-500", "new": "bg-red-500/50" },
        { "old": "text-opacity-75 text-blue-500", "new": "text-blue-500/75" }
      ],
      "priority": 2,
      "isRegex": true,
      "transform": "custom"
    },
    {
      "id": "shadow-scale",
      "category": "shadow",
      "deprecated": "shadow-sm",
      "canonical": "shadow-xs",
      "explanation": "Tailwind v4 adjusted shadow scale: shadow-sm → shadow-xs, shadow → shadow-sm",
      "examples": [
        { "old": "shadow-sm", "new": "shadow-xs" }
      ],
      "priority": 1
    },
    {
      "id": "drop-shadow-scale",
      "category": "shadow",
      "deprecated": "drop-shadow-sm",
      "canonical": "drop-shadow-xs",
      "explanation": "Tailwind v4 adjusted drop-shadow scale consistency",
      "examples": [
        { "old": "drop-shadow-sm", "new": "drop-shadow-xs" }
      ],
      "priority": 1
    },
    {
      "id": "rounded-scale",
      "category": "radius",
      "deprecated": "rounded-sm",
      "canonical": "rounded-xs",
      "explanation": "Tailwind v4 adjusted border-radius scale",
      "examples": [
        { "old": "rounded-sm", "new": "rounded-xs" }
      ],
      "priority": 1
    },
    {
      "id": "blur-scale",
      "category": "blur",
      "deprecated": "blur-sm",
      "canonical": "blur-xs",
      "explanation": "Tailwind v4 adjusted blur scale for consistency",
      "examples": [
        { "old": "blur-sm", "new": "blur-xs" }
      ],
      "priority": 1
    },
    {
      "id": "gradient-linear",
      "category": "gradient",
      "deprecated": "bg-gradient-to-r",
      "canonical": "bg-linear-to-r",
      "explanation": "Tailwind v4 added radial and conic gradients, renamed linear gradients for clarity",
      "examples": [
        { "old": "bg-gradient-to-r", "new": "bg-linear-to-r" },
        { "old": "bg-gradient-to-b", "new": "bg-linear-to-b" }
      ],
      "priority": 2
    },
    {
      "id": "outline-prefix",
      "category": "outline",
      "deprecated": "outline outline-",
      "canonical": "outline-",
      "explanation": "Tailwind v4 removed redundant 'outline' prefix; specify width directly with outline-2, etc.",
      "examples": [
        { "old": "outline outline-2 outline-blue-500", "new": "outline-2 outline-blue-500" }
      ],
      "priority": 2,
      "isRegex": true
    },
    {
      "id": "outline-none",
      "category": "outline",
      "deprecated": "outline-none",
      "canonical": "outline-hidden",
      "explanation": "Tailwind v4 uses outline-hidden for accessibility (sets outline-style: none)",
      "examples": [
        { "old": "outline-none", "new": "outline-hidden" }
      ],
      "priority": 2
    },
    {
      "id": "ring-default",
      "category": "ring",
      "deprecated": "ring ",
      "canonical": "ring-3",
      "explanation": "Tailwind v4 changed default ring width from 3px to 1px; use ring-3 to match v3 appearance",
      "examples": [
        { "old": "ring ring-blue-500", "new": "ring-3 ring-blue-500" }
      ],
      "priority": 2
    },
    {
      "id": "important-position",
      "category": "important",
      "deprecated": "!",
      "canonical": "!",
      "explanation": "Tailwind v4 moved ! important flag from start to end of class (e.g., flex! instead of !flex)",
      "examples": [
        { "old": "!flex !bg-red-500", "new": "flex! bg-red-500!" }
      ],
      "priority": 2,
      "isRegex": true
    },
    {
      "id": "css-var-arbitrary",
      "category": "arbitrary",
      "deprecated": "bg-\\[--",
      "canonical": "bg-\\(--",
      "explanation": "Tailwind v4 uses parenthesis notation for CSS variables in arbitrary values",
      "examples": [
        { "old": "bg-[--brand-color]", "new": "bg-(--brand-color)" }
      ],
      "priority": 1,
      "isRegex": true
    },
    {
      "id": "text-ellipsis",
      "category": "semantic",
      "deprecated": "overflow-ellipsis",
      "canonical": "text-ellipsis",
      "explanation": "Tailwind v4 used more semantic naming",
      "examples": [
        { "old": "overflow-ellipsis", "new": "text-ellipsis" }
      ],
      "priority": 3
    },
    {
      "id": "box-decoration-slice",
      "category": "semantic",
      "deprecated": "decoration-slice",
      "canonical": "box-decoration-slice",
      "explanation": "Tailwind v4 used more specific naming",
      "examples": [
        { "old": "decoration-slice", "new": "box-decoration-slice" }
      ],
      "priority": 3
    }
  ]
}
```

**Step 2: Verify JSON is valid**

Run:
```bash
cat .claude/skills/tailwind-v4-validator/patterns.json | jq . > /dev/null && echo "Valid JSON" || echo "Invalid JSON"
```

Expected: `Valid JSON`

---

## Task 2: Create Agent Skill

**Files:**
- Create: `.claude/skills/tailwind-v4-validator/SKILL.md`

**Step 1: Write the agent skill markdown**

Create `.claude/skills/tailwind-v4-validator/SKILL.md`:

```markdown
# Tailwind v4 Canonical Validator Agent

This agent helps Claude write canonical Tailwind CSS v4 classes and validates code for deprecated patterns.

## Quick Reference

### Flex Utilities (Priority 1)
- `flex-shrink-0` → `shrink-0`
- `flex-shrink-1` → `shrink-1`
- `flex-grow` → `grow`
- `flex-grow-0` → `grow-0`

### Opacity Modifiers (Priority 2)
Replace separate opacity utilities with slash notation:
- `bg-opacity-50 bg-red-500` → `bg-red-500/50`
- `text-opacity-75 text-blue-500` → `text-blue-500/75`
- `border-opacity-25 border-red-500` → `border-red-500/25`

### Scale Updates (Priority 1)
- `shadow-sm` → `shadow-xs` (shadow scale updated)
- `drop-shadow-sm` → `drop-shadow-xs`
- `rounded-sm` → `rounded-xs`
- `blur-sm` → `blur-xs`
- `backdrop-blur-sm` → `backdrop-blur-xs`

### Gradients (Priority 2)
- `bg-gradient-to-r` → `bg-linear-to-r`
- `bg-gradient-to-b` → `bg-linear-to-b`
- `bg-gradient-to-t` → `bg-linear-to-t`
- `bg-gradient-to-l` → `bg-linear-to-l`

### Outline Changes (Priority 2)
- `outline outline-2` → `outline-2` (remove redundant prefix)
- `outline-none` → `outline-hidden` (more accessible)

### Ring Width Default (Priority 2)
- `ring ring-blue-500` → `ring-3 ring-blue-500` (default changed 3px → 1px)

### Important Flag Position (Priority 2)
- `!flex !bg-red-500` → `flex! bg-red-500!` (flag moves to end)

### CSS Variable Arbitrary (Priority 1)
- `bg-[--brand-color]` → `bg-(--brand-color)`
- `w-[--custom-width]` → `w-(--custom-width)`

### Semantic Renames (Priority 3)
- `overflow-ellipsis` → `text-ellipsis`
- `decoration-slice` → `box-decoration-slice`
- `decoration-clone` → `box-decoration-clone`

## Usage

When writing Tailwind classes:
1. Check this reference for common patterns
2. Use canonical forms from the tables above
3. The PostToolUse hook will validate and auto-fix your code after edits

## Validation Rules

The automatic validator checks modified files for deprecated patterns and replaces them with canonical forms. Priority 1 rules are checked first and most commonly violated.
```

**Step 2: Verify the skill file exists**

Run:
```bash
test -f .claude/skills/tailwind-v4-validator/SKILL.md && echo "Skill file created" || echo "File not found"
```

Expected: `Skill file created`

---

## Task 3: Create Validation Utilities

**Files:**
- Create: `.claude/skills/tailwind-v4-validator/validate.ts`

**Step 1: Write the validation utility**

Create `.claude/skills/tailwind-v4-validator/validate.ts`:

```typescript
import * as fs from "fs";

interface PatternRule {
  id: string;
  category: string;
  deprecated: string;
  canonical: string | null;
  explanation: string;
  examples: Array<{ old: string; new: string }>;
  priority: number;
  isRegex?: boolean;
  transform?: string;
}

interface ValidationResult {
  file: string;
  violations: Array<{
    line: number;
    original: string;
    suggested: string;
    rule: PatternRule;
  }>;
}

export function loadPatterns(): PatternRule[] {
  const patternsPath = `${__dirname}/patterns.json`;
  const content = fs.readFileSync(patternsPath, "utf-8");
  const data = JSON.parse(content);
  return data.patterns.sort((a: PatternRule, b: PatternRule) => a.priority - b.priority);
}

export function validateClassString(classString: string, patterns: PatternRule[]): ValidationResult["violations"] {
  const violations: ValidationResult["violations"] = [];
  let lineNumber = 1;

  const lines = classString.split("\n");
  patterns.forEach((rule) => {
    lines.forEach((line, index) => {
      if (!line.includes("className") && !line.includes("class=")) {
        return;
      }

      let match;
      if (rule.isRegex) {
        const regex = new RegExp(rule.deprecated, "g");
        while ((match = regex.exec(line)) !== null) {
          violations.push({
            line: index + 1,
            original: match[0],
            suggested: handleSpecialTransforms(match[0], rule),
            rule,
          });
        }
      } else {
        if (line.includes(rule.deprecated)) {
          violations.push({
            line: index + 1,
            original: rule.deprecated,
            suggested: rule.canonical || rule.deprecated,
            rule,
          });
        }
      }
    });
  });

  return violations;
}

function handleSpecialTransforms(original: string, rule: PatternRule): string {
  if (rule.transform === "custom") {
    // Handle opacity modifier transformation
    if (rule.id === "opacity-modifier") {
      // Match: bg-opacity-50 bg-red-500 -> bg-red-500/50
      const opacityMatch = original.match(/(bg|text|border|divide|ring|placeholder)-opacity-(\d+)\s+(bg|text|border|divide|ring|placeholder)-/);
      if (opacityMatch) {
        const [, prefix, opacity, colorPrefix] = opacityMatch;
        return `${colorPrefix}-`;
      }
    }
    // Handle important flag position
    if (rule.id === "important-position") {
      return original.replace(/^!/, "").replace(/(\S+)$/, "$1!");
    }
    // Handle outline prefix
    if (rule.id === "outline-prefix") {
      return original.replace(/^outline\s+/, "");
    }
  }

  return rule.canonical || original;
}

export function fixViolations(content: string, violations: ValidationResult["violations"]): string {
  let fixed = content;

  // Sort by line number descending to avoid offset issues when replacing
  const sorted = [...violations].sort((a, b) => b.line - a.line);

  sorted.forEach((violation) => {
    const lines = fixed.split("\n");
    if (lines[violation.line - 1]) {
      lines[violation.line - 1] = lines[violation.line - 1].replace(violation.original, violation.suggested);
      fixed = lines.join("\n");
    }
  });

  return fixed;
}
```

**Step 2: Run validation on patterns.json to ensure structure is correct**

Run:
```bash
node -e "const ts = require('typescript'); const code = require('fs').readFileSync('.claude/skills/tailwind-v4-validator/validate.ts', 'utf-8'); ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }); console.log('TypeScript compilation OK')"
```

Expected: `TypeScript compilation OK`

---

## Task 4: Create PostToolUse Hook

**Files:**
- Create: `.claude/hooks/post-tool-use/tailwind-v4-validator.ts`

**Step 1: Write the hook that triggers on Edit tool use**

Create `.claude/hooks/post-tool-use/tailwind-v4-validator.ts`:

```typescript
import * as fs from "fs";
import * as path from "path";

interface EditToolUse {
  tool: "Edit";
  input: {
    file_path: string;
    new_string: string;
  };
}

export async function validateAndFixTailwindClasses(toolUse: EditToolUse): Promise<void> {
  if (toolUse.tool !== "Edit") {
    return;
  }

  const filePath = toolUse.input.file_path;
  const extensions = [".tsx", ".jsx", ".astro", ".css"];
  const shouldValidate = extensions.some((ext) => filePath.endsWith(ext));

  if (!shouldValidate) {
    return;
  }

  try {
    // Dynamically import patterns and validation
    const { loadPatterns, validateClassString, fixViolations } = await import(
      "../skills/tailwind-v4-validator/validate.ts"
    );

    const patterns = loadPatterns();
    const content = fs.readFileSync(filePath, "utf-8");
    const violations = validateClassString(content, patterns);

    if (violations.length > 0) {
      const fixed = fixViolations(content, violations);
      fs.writeFileSync(filePath, fixed);

      console.log(`\n✅ Tailwind v4 Validator: Fixed ${violations.length} deprecated patterns in ${path.basename(filePath)}`);
      violations.forEach((v) => {
        console.log(`  ${v.rule.category}: "${v.original}" → "${v.suggested}"`);
      });
    }
  } catch (error) {
    console.error("Tailwind v4 Validator hook error:", error);
  }
}
```

**Step 2: Register hook in Claude Code configuration**

Verify `.claude/settings.json` includes the hook:

```bash
cat .claude/settings.json | jq '.hooks.post-tool-use' 2>/dev/null || echo "Check settings"
```

**Step 3: Update settings.json to register hook**

Read current settings:
```bash
cat .claude/settings.json
```

Add this structure if not present:
```json
{
  "hooks": {
    "post-tool-use": [
      {
        "name": "tailwind-v4-validator",
        "path": ".claude/hooks/post-tool-use/tailwind-v4-validator.ts",
        "enabled": true
      }
    ]
  }
}
```

---

## Task 5: Create Unit Tests

**Files:**
- Create: `.claude/skills/tailwind-v4-validator/__tests__/validate.test.ts`

**Step 1: Write tests for pattern validation**

Create `.claude/skills/tailwind-v4-validator/__tests__/validate.test.ts`:

```typescript
import { loadPatterns, validateClassString, fixViolations } from "../validate";

describe("Tailwind v4 Validator", () => {
  describe("loadPatterns", () => {
    test("loads patterns from JSON", () => {
      const patterns = loadPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty("id");
      expect(patterns[0]).toHaveProperty("deprecated");
      expect(patterns[0]).toHaveProperty("canonical");
    });

    test("sorts patterns by priority", () => {
      const patterns = loadPatterns();
      for (let i = 1; i < patterns.length; i++) {
        expect(patterns[i - 1].priority).toBeLessThanOrEqual(patterns[i].priority);
      }
    });
  });

  describe("validateClassString", () => {
    test("detects flex-shrink-0 -> shrink-0", () => {
      const patterns = loadPatterns();
      const code = '<div className="flex-shrink-0">Item</div>';
      const violations = validateClassString(code, patterns);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].original).toContain("flex-shrink");
      expect(violations[0].suggested).toBe("shrink-0");
    });

    test("detects shadow-sm -> shadow-xs", () => {
      const patterns = loadPatterns();
      const code = '<div className="shadow-sm">Item</div>';
      const violations = validateClassString(code, patterns);
      expect(violations.some((v) => v.rule.id === "shadow-scale")).toBe(true);
    });

    test("detects outline-none -> outline-hidden", () => {
      const patterns = loadPatterns();
      const code = '<input className="outline-none" />';
      const violations = validateClassString(code, patterns);
      expect(violations.some((v) => v.rule.id === "outline-none")).toBe(true);
    });

    test("returns empty array for canonical classes", () => {
      const patterns = loadPatterns();
      const code = '<div className="flex gap-4 shrink-0">Item</div>';
      const violations = validateClassString(code, patterns);
      expect(violations.filter((v) => v.original.includes("flex") || v.original.includes("gap") || v.original.includes("shrink-0")).length).toBe(0);
    });
  });

  describe("fixViolations", () => {
    test("replaces deprecated classes with canonical forms", () => {
      const patterns = loadPatterns();
      const original = '<div className="flex-shrink-0 shadow-sm">Item</div>';
      const violations = validateClassString(original, patterns);
      const fixed = fixViolations(original, violations);
      expect(fixed).toContain("shrink-0");
      expect(fixed).toContain("shadow-xs");
    });

    test("preserves non-matching content", () => {
      const patterns = loadPatterns();
      const original = '<div className="flex gap-4">Item</div>';
      const violations = validateClassString(original, patterns);
      const fixed = fixViolations(original, violations);
      expect(fixed).toContain("flex gap-4");
    });
  });
});
```

**Step 2: Run tests**

Run:
```bash
npm test -- .claude/skills/tailwind-v4-validator/__tests__/validate.test.ts
```

Expected: All tests passing

---

## Task 6: Create Documentation

**Files:**
- Create: `.claude/skills/tailwind-v4-validator/README.md`

**Step 1: Write comprehensive documentation**

Create `.claude/skills/tailwind-v4-validator/README.md`:

```markdown
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

## Implementation Details

### Pattern Database
All patterns stored in `patterns.json` with:
- `id`: Unique identifier
- `category`: Type of utility
- `deprecated`: Old v3 pattern
- `canonical`: New v4 form
- `explanation`: Why it changed
- `priority`: Processing order
- `isRegex`: Whether pattern uses regex

### Validation Logic
`validate.ts` exports:
- `loadPatterns()`: Load pattern database
- `validateClassString()`: Check code for violations
- `fixViolations()`: Apply fixes to content

### Hook Trigger
PostToolUse hook triggers on:
- `.tsx` components
- `.jsx` components
- `.astro` components
- `.css` files

Validates only the edited file (performance-optimized).

## Usage

### As Agent Skill
Ask Claude directly:
```
"Is flex-shrink-0 canonical in Tailwind v4?"
"Convert my opacity modifiers to v4 syntax"
```

### Automatic (Hook)
Just edit your components normally. The hook validates and fixes after each change.

## Testing

Run tests:
```bash
npm test -- .claude/skills/tailwind-v4-validator/__tests__
```

## Troubleshooting

If a transformation seems wrong:
1. Check `patterns.json` for the rule
2. Review examples in the rule
3. Check `validate.ts` for special handling
4. Disable hook in `.claude/settings.json` temporarily to debug

## Future Enhancements

- [ ] Arbitrary value validation (e.g., spacing scale)
- [ ] Performance: cache pattern validation results
- [ ] Configuration: allow per-project pattern overrides
- [ ] Integration: Report violations in IDE inline
```

**Step 2: Verify documentation**

Run:
```bash
test -f .claude/skills/tailwind-v4-validator/README.md && wc -l .claude/skills/tailwind-v4-validator/README.md
```

Expected: File exists with >50 lines

---

## Task 7: Create Directory Structure & Commit

**Files:**
- Directory: `.claude/skills/tailwind-v4-validator/`
- Directory: `.claude/hooks/post-tool-use/`
- Directory: `.claude/skills/tailwind-v4-validator/__tests__/`

**Step 1: Verify directory structure**

Run:
```bash
tree -d .claude/skills/tailwind-v4-validator .claude/hooks/post-tool-use
```

**Step 2: Commit all files**

Run:
```bash
git add .claude/skills/tailwind-v4-validator .claude/hooks/post-tool-use docs/plans/2026-01-20-tailwind-v4-validator-implementation.md
git commit -m "feat: add tailwind v4 canonical validator agent skill with auto-fixing hook"
```

Expected: Commit succeeds

---

## Acceptance Criteria

✅ Pattern database includes all major v4 changes
✅ Agent skill provides quick reference for canonical classes
✅ PostToolUse hook validates modified files automatically
✅ Violations are fixed with canonical forms
✅ Tests pass for all transformation types
✅ Documentation explains usage and architecture
✅ All changes committed to git

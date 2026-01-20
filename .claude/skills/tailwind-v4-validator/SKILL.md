# Tailwind v4 Canonical Validator Agent

This agent helps Claude write canonical Tailwind CSS v4 classes and validates code for deprecated patterns.

## About This Skill

Tailwind CSS v4 introduced breaking changes to class naming and syntax. This skill helps you understand and apply these changes correctly:

- **Quick reference** for all canonical class names
- **Automatic validation** that catches deprecated patterns as you code
- **Priority-based fixes** that process changes by importance

Use this skill when you're unsure about class syntax, or let the automatic validator fix patterns as you work.

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

The default `ring` width changed from 3px (v3) to 1px (v4). To match v3 appearance, specify `ring-3`:
- `ring ring-blue-500` → `ring-3 ring-blue-500`

When you use bare `ring` without a width modifier, add `ring-3` to restore the previous visual style.

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

## How It Works

This skill provides two capabilities:

### 1. Quick Reference (You)
Use this markdown file to look up canonical Tailwind v4 class names when you're unsure about the correct syntax.

### 2. Automatic Validation & Fixing (Hook)
After you edit `.tsx`, `.jsx`, `.astro`, or `.css` files, a PostToolUse hook:
- Scans for deprecated Tailwind v4 patterns
- Auto-fixes violations with canonical forms
- Reports what was changed
- Processes by priority: Priority 1 rules first (most common), then 2, then 3

## Priority Levels Explained

- **Priority 1** (Most Common): Fundamental utility renames and highest-impact transformations
- **Priority 2** (Important): Common patterns that affect code correctness
- **Priority 3** (Edge Cases): Semantic improvements and less frequent patterns

The validator checks Priority 1 rules first, then cascades through 2 and 3, ensuring the most important fixes are applied first.

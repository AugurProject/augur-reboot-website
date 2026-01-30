# Arc → Blog Rename Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename the "Arc" blogging feature to "Blog" throughout the codebase in response to community feedback.

**Architecture:** Systematic find-and-replace with directory reorganization. Changes layout files, components, pages, content collections, and all imports. No functional changes - purely naming/organization.

**Tech Stack:** Astro 5.10+, React 19, TypeScript

---

## Task 1: Rename layout component

**Files:**
- Move: `src/layouts/ArcLayout.astro` → `src/layouts/BlogLayout.astro`
- Update: `src/layouts/BlogLayout.astro` (internal references)

**Step 1: Read current layout**

Run: `cat src/layouts/ArcLayout.astro`
Expected: Component with ArcLayout, ArcNavigation, ArcPostMeta imports

**Step 2: Create new BlogLayout.astro**

Copy `src/layouts/ArcLayout.astro` to `src/layouts/BlogLayout.astro`, then update these imports:
- Line 5: `import ArcNavigation from` → `import BlogNavigation from`
- Line 6: `import ArcPostMeta from` → `import BlogPostMeta from`

And update the component usage:
- Line 68: `<ArcNavigation` → `<BlogNavigation`
- Line 53: `<ArcPostMeta` → `<BlogPostMeta`

**Step 3: Delete old layout**

Run: `rm src/layouts/ArcLayout.astro`

**Step 4: Verify file exists**

Run: `ls -l src/layouts/BlogLayout.astro`
Expected: File exists with correct imports

**Step 5: Commit**

```bash
git add src/layouts/BlogLayout.astro
git rm src/layouts/ArcLayout.astro
git commit -m "refactor: rename ArcLayout to BlogLayout"
```

---

## Task 2: Rename component - ArcNavigation

**Files:**
- Move: `src/components/ArcNavigation.tsx` → `src/components/BlogNavigation.tsx`
- Update: Internal component name and props interface

**Step 1: Read current component**

Run: `cat src/components/ArcNavigation.tsx`
Expected: Component exports ArcNavigation, has Post interface

**Step 2: Create BlogNavigation.tsx**

Copy `src/components/ArcNavigation.tsx` to `src/components/BlogNavigation.tsx`, then update:
- Line with `export const ArcNavigation` → `export const BlogNavigation`
- Any internal references to `Arc` → `Blog`

**Step 3: Delete old file**

Run: `rm src/components/ArcNavigation.tsx`

**Step 4: Commit**

```bash
git add src/components/BlogNavigation.tsx
git rm src/components/ArcNavigation.tsx
git commit -m "refactor: rename ArcNavigation to BlogNavigation"
```

---

## Task 3: Rename component - ArcPostCard

**Files:**
- Move: `src/components/ArcPostCard.astro` → `src/components/BlogPostCard.astro`

**Step 1: Read current component**

Run: `cat src/components/ArcPostCard.astro`
Expected: Component with ArcPostCard export

**Step 2: Create BlogPostCard.astro**

Copy `src/components/ArcPostCard.astro` to `src/components/BlogPostCard.astro`, no internal name changes needed (component name not explicitly exported in Astro).

**Step 3: Delete old file**

Run: `rm src/components/ArcPostCard.astro`

**Step 4: Commit**

```bash
git add src/components/BlogPostCard.astro
git rm src/components/ArcPostCard.astro
git commit -m "refactor: rename ArcPostCard to BlogPostCard"
```

---

## Task 4: Rename component - ArcPostMeta

**Files:**
- Move: `src/components/ArcPostMeta.astro` → `src/components/BlogPostMeta.astro`

**Step 1: Copy and delete**

Run: `mv src/components/ArcPostMeta.astro src/components/BlogPostMeta.astro`

**Step 2: Commit**

```bash
git add src/components/BlogPostMeta.astro
git rm src/components/ArcPostMeta.astro
git commit -m "refactor: rename ArcPostMeta to BlogPostMeta"
```

---

## Task 5: Rename content directory

**Files:**
- Move: `src/content/arc/` → `src/content/blog/`

**Step 1: Move directory**

Run: `mv src/content/arc src/content/blog`

**Step 2: Verify**

Run: `ls -la src/content/blog/`
Expected: `generalizing-augur.mdx` file present

**Step 3: Commit**

```bash
git add src/content/blog
git rm -r src/content/arc
git commit -m "refactor: rename arc content collection to blog"
```

---

## Task 6: Update content/config.ts

**Files:**
- Modify: `src/content/config.ts`

**Step 1: Read current config**

Run: `cat src/content/config.ts`
Expected: arcCollection definition and collections export

**Step 2: Edit config.ts**

Replace:
```typescript
const arcCollection = defineCollection({
```
With:
```typescript
const blogCollection = defineCollection({
```

And replace:
```typescript
export const collections = {
  learn: learnCollection,
  arc: arcCollection,
};
```
With:
```typescript
export const collections = {
  learn: learnCollection,
  blog: blogCollection,
};
```

**Step 3: Verify changes**

Run: `cat src/content/config.ts`
Expected: blogCollection and blog in collections export

**Step 4: Commit**

```bash
git add src/content/config.ts
git commit -m "refactor: rename arc collection to blog in content config"
```

---

## Task 7: Rename pages directory and files

**Files:**
- Move: `src/pages/arc/` → `src/pages/blog/`
- Update: Import paths in both page files

**Step 1: Move directory**

Run: `mv src/pages/arc src/pages/blog`

**Step 2: Update index.astro imports**

Edit `src/pages/blog/index.astro`:
- Line 2: `getCollection('arc')` → `getCollection('blog')`
- Line 9: `import ArcPostCard from` → `import BlogPostCard from`
- Line 47: `<ArcPostCard` → `<BlogPostCard`
- Update Button import path if needed
- Update all comments referencing "arc" to "blog"

**Step 3: Update [...slug].astro imports**

Edit `src/pages/blog/[...slug].astro`:
- Line 2: `getCollection('arc')` → `getCollection('blog')`
- Line 3: Import path `../layouts/ArcLayout` → `../layouts/BlogLayout`
- Line 3: `ArcLayout` → `BlogLayout`
- Update layout usage in component

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds, blog routes pre-rendered

**Step 5: Commit**

```bash
git add src/pages/blog
git rm -r src/pages/arc
git commit -m "refactor: rename arc pages to blog"
```

---

## Task 8: Update other file references

**Files:**
- Modify: `src/pages/team.astro` (if it references arc)
- Modify: `src/pages/mission.astro` (if it references arc)
- Modify: `src/pages/index.astro` (if it references arc)
- Modify: Any other files that reference Arc components

**Step 1: Check team.astro**

Run: `grep -n arc src/pages/team.astro`
If matches found, update any Arc references to Blog

**Step 2: Check mission.astro**

Run: `grep -n arc src/pages/mission.astro`
If matches found, update any Arc references to Blog

**Step 3: Check all astro pages**

Run: `grep -r "ArcLayout\|ArcNavigation\|ArcPostCard\|ArcPostMeta" src/pages/`
Update any matches

**Step 4: Check all components**

Run: `grep -r "ArcLayout\|ArcNavigation\|ArcPostCard\|ArcPostMeta" src/components/`
Update any matches

**Step 5: Verify no Arc references remain**

Run: `grep -ri "arc" src/ --include="*.astro" --include="*.tsx" --include="*.ts" | grep -i "import\|component\|layout"`
Should return no Arc component references

**Step 6: Commit if changes made**

```bash
git add src/pages/ src/components/
git commit -m "refactor: update all Arc component references to Blog"
```

---

## Task 9: Final verification

**Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: PASS - no TypeScript errors

**Step 2: Run build**

Run: `npm run build`
Expected: PASS - build succeeds, blog routes pre-rendered at `/blog/` and `/blog/generalizing-augur/`

**Step 3: Check git status**

Run: `git status`
Expected: Clean working tree, all changes committed

**Step 4: View commit log**

Run: `git log --oneline -10`
Expected: 9 commits for arc→blog rename tasks

**Step 5: Final commit summary**

Run: `git log --oneline -9 | head -1`
Should show the last refactoring commit

---

## Success Criteria

✓ All Arc components renamed to Blog components
✓ Directory structure: `src/pages/blog/`, `src/content/blog/`
✓ Content collection renamed from `arc` to `blog`
✓ All imports updated throughout codebase
✓ Build passes with pre-rendered routes at `/blog/`
✓ Typecheck passes with no errors
✓ Git history shows 9 clean commits with descriptive messages

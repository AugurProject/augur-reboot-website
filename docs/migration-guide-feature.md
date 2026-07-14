---
title: Migration Guide Feature
tags: [migration, feature, learn, fork]
---

# Migration Guide Feature

> The Moon Fork migration guide: a step-by-step walkthrough for REP holders who must migrate before the deadline.

## Overview

The migration guide lives at `/learn/fork/migration/` and uses a dedicated **MigrationGuideLayout** with an urgent, red-coded header. It's part of the `learn` content collection but renders with a different layout than other learn articles.

## Route & Files

| Component | Location |
|-----------|----------|
| Content (MDX) | `src/content/learn/fork/migration.mdx` |
| Layout | `src/layouts/MigrationGuideLayout.astro` |
| Step images | `src/assets/learn/migration/step-01.png` through `step-06.png` |
| CTA component | `src/features/learn/migration-cta.tsx` |
| Route handler | `src/pages/learn/[...slug].astro` (conditional layout switch) |

## Layout Selection

`src/pages/learn/[...slug].astro` checks `entry.slug` and routes to the appropriate layout:

```astro
{entry.slug === 'fork/migration' ? (
  <MigrationGuideLayout title={title} description={description}>
    <Content />
  </MigrationGuideLayout>
) : (
  <LearnLayout title={title} description={description}>
    <Content />
  </LearnLayout>
)}
```

## MigrationGuideLayout

A dedicated layout distinct from [[technical-architecture]]'s standard LearnLayout:

- **Header**: Red-bordered alert box with `CRITICAL · MIGRATION IMMINENT` eyebrow and deadline display (default: "AUGUST 1, 2026")
- **Navigation**: Uses the same `LearnNavigation.tsx` sidebar with migration guide as the first/critical topic
- **Prose**: Same typographic treatment as LearnLayout articles

## MigrationCta Component

`src/features/learn/migration-cta.tsx` — a reusable red-bordered CTA block that links to `/learn/fork/migration/` by default. Props:

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `href` | string | `/learn/fork/migration/` | Link target |
| `eyebrow` | string | required | Small label above title |
| `title` | string | required | Main CTA heading |
| `description` | string | required | Body text |
| `className` | string | `''` | Extra Tailwind classes |

## Cross-References

- [[technical-architecture]] — overall component hierarchy
- [[fork-mechanics]] — what a fork is and why migration is needed
- [[blog-feature]] — the content collection system

# MDX Content Patterns

## Standard Markdown

All standard Markdown syntax works in MDX files. Common patterns used in this project:

### Headings and Structure

```mdx
## Section Title

Regular paragraph text. Keep paragraphs focused.

### Subsection
```

### Images

Images are stored alongside the MDX file and referenced with relative paths:

```mdx
![Alt text describing the image](./featured-image.webp)
![Roadmap diagram](./content-image.webp)
```

Image formats used: `.webp` (preferred for size), `.png`, `.jpg`

### Links

```mdx
[Discord community](https://discord.com/invite/Y3tCZsSmz3)
[Twitter / X](https://x.com/AugurProject)

<!-- For relative internal links -->
[Learn about forks](/learn/fork)
[Previous post](/blog/augur-reboot-2025)
```

### Emphasis and Code

```mdx
**Bold text** for emphasis
*Italic* for terminology

Inline `code` for technical terms

\```typescript
// Code blocks with language hint
const value = atom<number>(0)
\```
```

### Lists

```mdx
- Unordered item
- Another item
  - Nested item

1. Ordered step
2. Second step
```

## Blog Post Template

```mdx
---
title: "Post Title"
description: "One sentence summary of the post."
author: "Lituus Foundation"
publishDate: 2026-02-21
tags: ["augur", "update"]
---

![Featured image alt text](./featured-image.webp)

Opening paragraph. Lead with the most important information.

## First Section

Content here.

## Second Section

More content.

---

Call to action or closing. Link to Discord, Twitter, or relevant resources.
```

## Learn Article Template

```mdx
---
title: "Article Title"
description: "What this article covers."
---

## Overview

Brief introduction to the topic.

## Main Content

Educational content here. Aim for clarity over brevity.

## Key Takeaways

- Point one
- Point two
- Point three
```

## File Naming Conventions

**Blog slugs** — use kebab-case, descriptive, no dates in the directory name:
```
src/content/blog/augur-reboot-2025/     ✓
src/content/blog/2025-04-01-roadmap/    ✗
```

**Learn articles** — organized by topic directory:
```
src/content/learn/fork/index.mdx            # Topic root
src/content/learn/fork/disputes-and-bonds.mdx  # Topic article
```

## Image Optimization

Images in content directories are processed by Astro's image pipeline. Use `.webp` format for best performance. Recommended sizes:
- `featured-image.webp` — 1200×630px (used for og:image and post cards)
- `content-image.webp` — 800px wide minimum, any height

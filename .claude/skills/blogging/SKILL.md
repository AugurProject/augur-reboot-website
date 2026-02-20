---
name: blogging
description: This skill should be used when the user asks to "add a blog post", "create a new post", "write a learn article", "publish an update", "add content to the learn section", "update the blog", or needs help with MDX content, frontmatter, or the content collection structure.
---

# Blogging

The site has two content collections: `blog` for Augur project updates and `learn` for educational fork content. Both use MDX with frontmatter, stored as files in `src/content/`.

## Content Structure

```
src/content/
├── config.ts           # Zod schemas for both collections
├── blog/
│   └── {slug}/
│       ├── index.mdx   # Post content
│       └── *.webp      # Images (featured-image.webp, content-image.webp)
└── learn/
    └── {topic}/
        └── {slug}.mdx  # Article content (or index.mdx for topic root)
```

Each blog post gets its own directory named by slug. Images live alongside the MDX file and are referenced with relative paths.

## Blog Frontmatter

Defined in `src/content/config.ts`:

```yaml
---
title: "Post Title"          # required
description: "Short summary" # required
author: "Lituus Foundation"  # required
publishDate: 2026-02-21      # required, YYYY-MM-DD
updatedDate: 2026-02-21      # optional
tags: ["augur", "update"]    # optional
---
```

## Learn Frontmatter

```yaml
---
title: "Article Title"       # required
description: "Optional summary" # optional
---
```

## Add a Blog Post

1. Create the directory: `src/content/blog/{post-slug}/`
2. Create `index.mdx` with required frontmatter
3. Add `featured-image.webp` (used in post cards and og:image)
4. Optionally add `content-image.webp` for in-post images
5. Reference images with relative paths: `![Alt text](./featured-image.webp)`

Example structure for a new post:
```
src/content/blog/augur-q1-update/
├── index.mdx
└── featured-image.webp
```

## Add a Learn Article

1. Identify the topic directory under `src/content/learn/` (e.g., `fork/`)
2. Create the MDX file at `src/content/learn/{topic}/{slug}.mdx`
3. Add frontmatter with at minimum a `title`
4. Content is educational — link to relevant docs, protocol reference, or blog posts

## MDX Content

Standard Markdown applies. MDX also allows importing Astro/React components if needed, but most posts use plain Markdown with images.

Image syntax with relative path:
```mdx
![Augur Roadmap](./content-image.webp)
```

External links:
```mdx
[Discord](https://discord.com/invite/Y3tCZsSmz3)
```

## RSS Feed

The RSS feed is auto-generated from the blog collection via `@astrojs/rss`. No manual steps needed — publishing a post (adding to `src/content/blog/`) is sufficient for it to appear in the feed after the next build.

## Verify the Post

After adding content, run the dev server to check rendering:

```bash
npm run dev
```

Navigate to `/blog/{slug}` to verify the post renders correctly. Check that:
- Frontmatter fields display (title, date, author, tags)
- Images load with correct paths
- MDX content renders properly

Run type checking to catch frontmatter schema errors:

```bash
npm run typecheck
```

## Additional Resources

- **`references/content-schema.md`** — Full Zod schema, field types, validation rules
- **`references/mdx-patterns.md`** — MDX syntax, component usage, image handling patterns

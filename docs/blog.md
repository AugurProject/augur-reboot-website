# Blog Feature Documentation

## Overview

The blog is built on Astro's content collections, allowing you to write posts as Markdown/MDX files with YAML frontmatter. Posts are automatically routed to `/blog/[slug]` with social sharing, RSS feed support, and automatic thumbnail generation.

## Architecture

- **Content Storage**: `src/content/blog/` directory
- **Content Schema**: Defined in `src/content/config.ts`
- **Routes**: Generated at build time from files in `src/content/blog/`
- **Thumbnails**: Auto-loaded from `public/og-images/[slug].png`
- **RSS Feed**: Generated at `/rss.xml`

## Directory Structure

```
src/
├── content/
│   └── blog/
│       ├── generalizing-augur.mdx
│       └── [new-post-name].mdx
├── layouts/
│   └── BlogLayout.astro
├── components/
│   ├── BlogNavigation.tsx
│   ├── BlogPostCard.astro
│   ├── BlogPostMeta.astro
│   └── SocialShareButtons.astro
├── pages/
│   └── blog/
│       ├── index.astro (blog listing)
│       ├── [...slug].astro (individual post)
│       └── rss.xml.ts (RSS feed)
└──
public/
└── og-images/
    ├── generalizing-augur.png
    └── [new-post-name].png
```

## Creating a Blog Post

### Step 1: Create the MDX file

Create a new `.mdx` file in `src/content/blog/`:

```bash
touch src/content/blog/my-new-post.mdx
```

### Step 2: Add frontmatter

Start the file with YAML frontmatter:

```yaml
---
title: "Your Post Title Here"
description: "A brief description that appears in listings and meta tags"
author: "Your Name or Team Name"
publishDate: 2026-01-30
updatedDate: 2026-01-31
tags: ["tag1", "tag2", "tag3"]
---
```

**Frontmatter Fields:**
- `title` (required): Post title, appears in page title and listings
- `description` (required): Brief summary, used in meta tags and previews
- `author` (required): Author name, displayed in post metadata
- `publishDate` (required): Publication date in YYYY-MM-DD format
- `updatedDate` (optional): Last update date, shows when post was modified
- `tags` (optional): Array of topic tags for categorization

### Step 3: Write content

After the frontmatter, write your post in Markdown/MDX:

**Basic Formatting:**
```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text** and *italic text*

[Links](https://example.com)

- Bullet lists
- Multiple items
  - Nested items

1. Numbered lists
2. Multiple items
```

**MDX Features:**
- Import React components: `import MyComponent from '@/components/MyComponent'`
- Use JSX: `<MyComponent prop="value" />`
- Code blocks with syntax highlighting

### Step 4: Add thumbnail image

Create a social media thumbnail image for your post:

**Image Requirements:**
- **Size**: 1200 × 627 pixels (1.91:1 aspect ratio)
- **Format**: PNG, JPG, WebP, or AVIF
- **File size**: Less than 1MB

**Save the image:**

Place the image in `public/og-images/` with a name matching your post slug:

```
public/og-images/[your-post-slug].png
```

**Example:**
- Post file: `src/content/blog/introducing-augur-reboot.mdx`
- Image file: `public/og-images/introducing-augur-reboot.png`

The image filename **must match your MDX filename** (without the `.mdx` extension).

**What if I don't add an image?**
The site will use the default Augur thumbnail. Social shares will still work—just won't have a custom image.

### Step 5: File naming

Use kebab-case for filenames and images:
- ✓ `my-post-title.mdx` with `my-post-title.png`
- ✓ `augur-update-2026.mdx` with `augur-update-2026.png`
- ✗ `MyPostTitle.mdx` or `my post title.mdx`

The filename becomes the URL slug (without `.mdx`):
- `generalizing-augur.mdx` → `/blog/generalizing-augur`

## Post Metadata Display

Posts automatically display:
- **Title**: From frontmatter
- **Author**: From frontmatter
- **Publish Date**: From `publishDate` frontmatter
- **Updated Date**: From `updatedDate` (if present)
- **Tags**: From frontmatter array
- **Social Sharing**: Buttons to share on Twitter, LinkedIn, and via email
- **Navigation**: Links to next/previous posts

## Social Sharing

### Automatic Sharing Preview

When you share a blog post on social media (Twitter, LinkedIn, Facebook), the platform automatically:
1. Pulls the post title from the page
2. Pulls the description
3. Pulls your custom thumbnail image from `public/og-images/[slug].png`
4. Displays a preview card

### Share Buttons

Each blog post has three share buttons:
- **Twitter**: Opens Twitter with pre-filled text
- **LinkedIn**: Opens LinkedIn share dialog
- **Email**: Opens email composer with post link and description

## RSS Feed

Your blog is automatically syndicated via RSS at: `/rss.xml`

Readers can subscribe to get notifications when new posts are published.

## Content Collection Schema

Posts must conform to the schema defined in `src/content/config.ts`:

```typescript
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    publishDate: z.date(),
    updatedDate: z.date().optional(),
    tags: z.array(z.string()).optional(),
  }),
});
```

If your frontmatter doesn't match (missing required fields, wrong types), the build will fail with a clear error message.

## Development

### Preview locally

```bash
npm run dev
```

Visit http://localhost:4321/blog to see your posts.

### Build for production

```bash
npm run build
```

Posts are pre-rendered into static HTML at build time. RSS feed is generated in the output.

### Verify frontmatter

The build will fail if frontmatter is invalid. Common issues:
- Missing required fields (title, author, publishDate)
- Wrong date format (must be YYYY-MM-DD)
- `tags` must be an array, not a string
- Description is required (can't be empty)

## Examples

### Example 1: Simple post

```mdx
---
title: "Introducing the Augur Reboot"
description: "A fresh perspective on Augur protocol evolution"
author: "Lituus Labs"
publishDate: 2026-01-15
tags: ["augur", "announcement"]
---

# Introducing the Augur Reboot

We're excited to announce the next phase of Augur development...

## Key improvements

- Faster predictions
- Better UX
- Stronger protocols
```

**Image:** `public/og-images/introducing-augur-reboot.png` (1200×627)

### Example 2: Post with JSX

```mdx
---
title: "Technical Deep Dive"
description: "Understanding the protocol mechanics"
author: "Engineering Team"
publishDate: 2026-01-20
tags: ["technical", "protocol"]
---

import { CodeBlock } from '@/components/CodeBlock'

# Technical Deep Dive

Here's how the system works:

<CodeBlock language="solidity">
{`contract Augur {
  // Implementation
}`}
</CodeBlock>

Regular markdown text continues here.
```

**Image:** `public/og-images/technical-deep-dive.png` (1200×627)

## Troubleshooting

**Build fails with "validation error"**
- Check frontmatter field names and types match `src/content/config.ts`
- Ensure `publishDate` is in YYYY-MM-DD format
- Verify all required fields are present (title, description, author, publishDate)

**Post doesn't appear on site**
- Check filename is in `src/content/blog/` (not nested in subdirectories)
- Verify filename has `.mdx` extension
- Run `npm run build` to trigger type checking

**Social preview not showing custom image**
- Verify image file exists at `public/og-images/[slug].png`
- Check filename matches post slug exactly
- Try clearing browser cache and resharing

**Frontmatter not parsing**
- Ensure YAML is valid (check indentation)
- Surround string values with quotes if they contain special characters
- Use `2026-01-30` for dates, not `01/30/2026`

## Related Docs

- **Technical Architecture**: `docs/technical-architecture.md`
- **Astro Content Collections**: https://docs.astro.build/en/guides/content-collections/
- **RSS Feed**: `/rss.xml`

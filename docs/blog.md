# Blog Feature Documentation

## Overview

The blog is built on Astro's content collections, allowing you to write posts as Markdown/MDX files with YAML frontmatter. Posts are automatically routed to `/blog/[slug]` with featured images, social sharing, and RSS feed support.

## Architecture

- **Content Storage**: `src/content/blog/[slug]/index.mdx` (per-directory structure)
- **Content Schema**: Defined in `src/content/config.ts`
- **Routes**: Generated at build time from directories in `src/content/blog/`
- **Featured Images**: Stored inline as `featured-image.webp` in each post directory
- **RSS Feed**: Generated at `/rss.xml`

## Directory Structure

```
src/
├── content/
│   └── blog/
│       ├── generalizing-augur/
│       │   ├── index.mdx
│       │   └── featured-image.webp
│       └── [new-post-name]/
│           ├── index.mdx
│           └── featured-image.webp
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
```

## Creating a Blog Post

### Step 1: Create the post directory

Create a new directory in `src/content/blog/`:

```bash
mkdir src/content/blog/my-new-post
```

### Step 2: Add frontmatter

Create `index.mdx` in the directory with YAML frontmatter:

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
- `tags` (optional): Array of topic tags for RSS categorization (not displayed on page)

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

![Image alt text](./featured-image.webp)
```

**MDX Features:**
- Import React components: `import MyComponent from '@/components/MyComponent'`
- Use JSX: `<MyComponent prop="value" />`
- Code blocks with syntax highlighting
- Relative image paths for inline images

### Step 4: Add featured image

Create a featured image for your post:

**Image Requirements:**
- **Size**: 1200 × 630 pixels (1.91:1 aspect ratio - standard OG image size)
- **Format**: WebP (preferred), PNG, or JPG
- **File size**: Less than 1MB recommended

**Save the image:**

Place the image in your post directory as `featured-image.webp`:

```
src/content/blog/[your-post-slug]/featured-image.webp
```

**Example:**
- Post directory: `src/content/blog/introducing-augur-reboot/`
- MDX file: `src/content/blog/introducing-augur-reboot/index.mdx`
- Image file: `src/content/blog/introducing-augur-reboot/featured-image.webp`

**Additional inline images:**

You can add more images to the post directory with descriptive names:
- `architecture.webp`
- `timeline.webp`
- `content-image.webp`

Reference them in your MDX with relative paths:
```markdown
![Architecture diagram](./architecture.webp)
```

### Step 5: Directory naming

Use kebab-case for directory names:
- ✓ `my-post-title/`
- ✓ `augur-update-2026/`
- ✗ `MyPostTitle/` or `my post title/`

The directory name becomes the URL slug:
- `generalizing-augur/index.mdx` → `/blog/generalizing-augur`

## Post Metadata Display

Posts automatically display:
- **Title**: From frontmatter
- **Author**: From frontmatter
- **Publish Date**: From `publishDate` frontmatter
- **Updated Date**: From `updatedDate` (if present)
- **Featured Image**: On blog listing cards (desktop: left sidebar, mobile: top)
- **Social Sharing**: Buttons to share on Twitter, LinkedIn, and via email
- **Navigation**: Links to next/previous posts

**Note:** Tags are included in frontmatter for RSS categorization but are not displayed on the page.

## Social Sharing

### Automatic Sharing Preview

When you share a blog post on social media (Twitter, LinkedIn, Facebook), the platform automatically:
1. Pulls the post title from the page
2. Pulls the description
3. Pulls the featured image (optimized at build time from `featured-image.webp`)
4. Displays a preview card

**Note:** The featured image is automatically optimized for Open Graph (1200×630) at build time from the `featured-image.webp` in your post directory.

### Share Buttons

Each blog post has three share buttons:
- **Twitter**: Opens Twitter with pre-filled text
- **LinkedIn**: Opens LinkedIn share dialog
- **Email**: Opens email composer with post link and description

## RSS Feed

Your blog is automatically syndicated via RSS at: `/rss.xml`

The RSS feed includes:
- Post title, description, and link
- Publication date
- Author
- Categories (from tags)

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

![Featured image](./featured-image.webp)

## Key improvements

- Faster predictions
- Better UX
- Stronger protocols
```

**Directory structure:**
```
src/content/blog/introducing-augur-reboot/
├── index.mdx
└── featured-image.webp (1200×630)
```

### Example 2: Post with JSX and multiple images

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

![Architecture](./architecture.webp)

<CodeBlock language="solidity">
{`contract Augur {
  // Implementation
}`}
</CodeBlock>

Regular markdown text continues here.

![Timeline](./timeline.webp)
```

**Directory structure:**
```
src/content/blog/technical-deep-dive/
├── index.mdx
├── featured-image.webp (1200×630)
├── architecture.webp
└── timeline.webp
```

## Troubleshooting

**Build fails with "validation error"**
- Check frontmatter field names and types match `src/content/config.ts`
- Ensure `publishDate` is in YYYY-MM-DD format
- Verify all required fields are present (title, description, author, publishDate)

**Post doesn't appear on site**
- Check directory is in `src/content/blog/`
- Verify the directory contains `index.mdx`
- Run `npm run build` to trigger type checking

**Featured image not showing**
- Verify image file exists at `[post-dir]/featured-image.webp`
- Check image dimensions are 1200×630 (1.91:1 aspect ratio)
- Try clearing browser cache

**Images broken in post content**
- Use relative paths: `./image-name.webp` not `/image-name.webp`
- Verify image files are in the same directory as `index.mdx`

**Frontmatter not parsing**
- Ensure YAML is valid (check indentation)
- Surround string values with quotes if they contain special characters
- Use `2026-01-30` for dates, not `01/30/2026`

## Related Docs

- **Technical Architecture**: `docs/technical-architecture.md`
- **Astro Content Collections**: https://docs.astro.build/en/guides/content-collections/
- **RSS Feed**: `/rss.xml`

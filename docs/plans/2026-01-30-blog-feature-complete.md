# Blog Feature Completion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the blog feature with social sharing, RSS feeds, and comprehensive documentation.

**Architecture:** Build on existing Arc→Blog rename. Add automatic OG image assignment from slug, social share buttons, RSS feed generation, and documentation with writer instructions for images.

**Tech Stack:** Astro 5.10+, TypeScript, Tailwind CSS, RSS generation (astro-rss)

---

## Task 1: Fix BlogLayout title reference

**Files:**
- Modify: `src/layouts/BlogLayout.astro:32`

**Step 1: Read current layout**

Run: `cat src/layouts/BlogLayout.astro | head -35`
Expected: Line 32 shows "The Augur Arc"

**Step 2: Fix title text**

Edit `src/layouts/BlogLayout.astro` line 32:

Change:
```astro
title={`${title} - The Augur Arc`}
```

To:
```astro
title={`${title} - The Augur Blog`}
```

**Step 3: Verify**

Run: `grep "The Augur Blog" src/layouts/BlogLayout.astro`
Expected: Match found

**Step 4: Commit**

```bash
git add src/layouts/BlogLayout.astro
git commit -m "fix: update BlogLayout title from Arc to Blog"
```

---

## Task 2: Update blog page to auto-assign OG images

**Files:**
- Modify: `src/pages/blog/[...slug].astro`

**Step 1: Read current page**

Run: `cat src/pages/blog/[...slug].astro`
Expected: Current structure with entry, slug, BlogLayout

**Step 2: Add OG image logic**

Edit `src/pages/blog/[...slug].astro` after line 43 (after destructuring entry.data):

```typescript
const { entry, prevPost, nextPost } = Astro.props;
const { Content } = await entry.render();
const { title, description, author, publishDate, updatedDate, tags } = entry.data;

// Auto-assign OG image from slug
const ogImage = `/og-images/${entry.slug}.png`;
```

**Step 3: Pass ogImage to BlogLayout**

Update the BlogLayout component call to pass the ogImage. Add it after `tags={tags}` (around line 55):

```astro
<BlogLayout
  title={title}
  description={description}
  author={author}
  publishDate={publishDate}
  updatedDate={updatedDate}
  tags={tags}
  ogImage={ogImage}
  prevPost={prevPost}
  nextPost={nextPost}
>
```

**Step 4: Verify file**

Run: `grep "ogImage" src/pages/blog/[...slug].astro`
Expected: Two matches (const declaration and prop)

**Step 5: Commit**

```bash
git add src/pages/blog/[...slug].astro
git commit -m "feat: auto-assign OG images to blog posts from slug"
```

---

## Task 3: Update BlogLayout to pass OG image to Layout

**Files:**
- Modify: `src/layouts/BlogLayout.astro`

**Step 1: Update BlogLayout props**

Edit `src/layouts/BlogLayout.astro` interface Props (around line 17):

Add new prop after `tags?: string[]`:

```typescript
interface Props {
  title: string;
  description?: string;
  author: string;
  publishDate: Date;
  updatedDate?: Date;
  tags?: string[];
  ogImage?: string;
  prevPost?: Post;
  nextPost?: Post;
}
```

**Step 2: Destructure ogImage**

Edit line 28 to include ogImage:

```typescript
const { title, description, author, publishDate, updatedDate, tags, ogImage, prevPost, nextPost } = Astro.props;
```

**Step 3: Pass to Layout component**

Edit the `<Layout>` component call (around line 31) to include ogImage:

```astro
<Layout
  title={`${title} - The Augur Blog`}
  description={description}
  ogImage={ogImage}
  ogType="article"
>
```

**Step 4: Verify**

Run: `npm run typecheck`
Expected: PASS - no TypeScript errors

**Step 5: Commit**

```bash
git add src/layouts/BlogLayout.astro
git commit -m "feat: pass OG image through BlogLayout to Layout component"
```

---

## Task 4: Add social share buttons component

**Files:**
- Create: `src/components/SocialShareButtons.astro`

**Step 1: Create component**

Create `src/components/SocialShareButtons.astro`:

```astro
---
interface Props {
  title: string;
  url: string;
  description?: string;
}

const { title, url, description } = Astro.props;

// Encode parameters for URLs
const encodedTitle = encodeURIComponent(title);
const encodedUrl = encodeURIComponent(url);
const encodedDesc = encodeURIComponent(description || title);

// Social share URLs
const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
const emailUrl = `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`;
---

<div class="flex gap-4 items-center">
  <span class="text-sm text-muted-foreground">Share:</span>

  <a
    href={twitterUrl}
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
    aria-label="Share on Twitter"
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7a10.6 10.6 0 01-9-5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>
    Twitter
  </a>

  <a
    href={linkedinUrl}
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
    aria-label="Share on LinkedIn"
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" fill="currentColor"/>
      <circle cx="4" cy="4" r="2" fill="currentColor"/>
    </svg>
    LinkedIn
  </a>

  <a
    href={emailUrl}
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
    aria-label="Share via email"
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
    Email
  </a>
</div>

<style>
  a {
    border: 1px solid var(--color-muted-foreground);
  }

  a:hover {
    border-color: var(--color-primary);
  }
</style>
```

**Step 2: Verify syntax**

Run: `npm run typecheck`
Expected: PASS - no TypeScript errors

**Step 3: Commit**

```bash
git add src/components/SocialShareButtons.astro
git commit -m "feat: add social share buttons component (Twitter, LinkedIn, Email)"
```

---

## Task 5: Add social share buttons to BlogLayout

**Files:**
- Modify: `src/layouts/BlogLayout.astro`

**Step 1: Import component**

Edit `src/layouts/BlogLayout.astro` line 10, add import after existing imports:

```astro
import SocialShareButtons from "../components/SocialShareButtons.astro";
```

**Step 2: Update Props interface**

Add to Props interface (around line 25):

```typescript
interface Props {
  title: string;
  description?: string;
  author: string;
  publishDate: Date;
  updatedDate?: Date;
  tags?: string[];
  ogImage?: string;
  postUrl?: string;
  prevPost?: Post;
  nextPost?: Post;
}
```

**Step 3: Update destructuring**

Edit line 28 to include postUrl:

```typescript
const { title, description, author, publishDate, updatedDate, tags, ogImage, postUrl, prevPost, nextPost } = Astro.props;
```

**Step 4: Add social buttons to template**

Add component after BlogPostMeta (around line 59), inside the main content area:

```astro
{postUrl && (
  <SocialShareButtons
    title={title}
    url={postUrl}
    description={description}
  />
)}
```

**Step 5: Verify**

Run: `npm run typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add src/layouts/BlogLayout.astro
git commit -m "feat: add social share buttons to blog post layout"
```

---

## Task 6: Update blog page to pass postUrl

**Files:**
- Modify: `src/pages/blog/[...slug].astro`

**Step 1: Add postUrl variable**

Edit `src/pages/blog/[...slug].astro`, add after ogImage assignment:

```typescript
// Auto-assign OG image from slug
const ogImage = `/og-images/${entry.slug}.png`;

// Construct full post URL
const postUrl = new URL(`/blog/${entry.slug}`, Astro.site).href;
```

**Step 2: Pass to BlogLayout**

Update BlogLayout component call to include postUrl:

```astro
<BlogLayout
  title={title}
  description={description}
  author={author}
  publishDate={publishDate}
  updatedDate={updatedDate}
  tags={tags}
  ogImage={ogImage}
  postUrl={postUrl}
  prevPost={prevPost}
  nextPost={nextPost}
>
```

**Step 3: Verify**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pages/blog/[...slug].astro
git commit -m "feat: pass post URL to BlogLayout for social sharing"
```

---

## Task 7: Add RSS feed generation

**Files:**
- Create: `src/pages/rss.xml.ts`

**Step 1: Check astro-rss availability**

Run: `npm ls @astrojs/rss`
Expected: Package listed (or install it)

If not installed:
```bash
npm install @astrojs/rss
```

**Step 2: Create RSS feed**

Create `src/pages/rss.xml.ts`:

```typescript
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const blog = await getCollection('blog');

  // Sort by publish date, newest first
  const sortedBlog = blog.sort((a, b) =>
    b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  );

  return rss({
    title: 'Augur Blog',
    description: 'Latest insights and updates from the Augur Project',
    site: context.site,
    items: sortedBlog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
      author: post.data.author,
      categories: post.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}
```

**Step 3: Verify file**

Run: `cat src/pages/rss.xml.ts`
Expected: File created with correct structure

**Step 4: Commit**

```bash
git add src/pages/rss.xml.ts
git commit -m "feat: add RSS feed for blog posts"
```

---

## Task 8: Create comprehensive blog documentation

**Files:**
- Create: `docs/blog.md`

**Step 1: Create documentation**

Create `docs/blog.md` with comprehensive content:

```markdown
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
```

**Step 2: Commit**

```bash
git add docs/blog.md
git commit -m "docs: add comprehensive blog feature documentation with image instructions"
```

---

## Task 9: Create public/og-images directory

**Files:**
- Directory: `public/og-images/`

**Step 1: Create directory**

Run: `mkdir -p public/og-images`

**Step 2: Add .gitkeep placeholder**

Run: `touch public/og-images/.gitkeep`

**Step 3: Verify**

Run: `ls -la public/og-images/`
Expected: `.gitkeep` file present

**Step 4: Commit**

```bash
git add public/og-images/.gitkeep
git commit -m "chore: create og-images directory for blog post thumbnails"
```

---

## Task 10: Final verification and testing

**Step 1: Verify all files exist**

Run: `git status`
Expected: Clean working tree, all changes committed

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS - no TypeScript errors

**Step 3: Run build**

Run: `npm run build`
Expected: PASS - build succeeds, RSS feed generated, blog routes pre-rendered

**Step 4: Verify RSS feed generated**

Run: `test -f dist/rss.xml && echo "RSS feed exists" || echo "RSS feed missing"`
Expected: RSS feed exists message

**Step 5: Check social share buttons render**

Manually preview in dev:
```bash
npm run dev
```

Visit http://localhost:4321/blog/generalizing-augur
Expected: Social share buttons visible below post metadata

**Step 6: View commit log**

Run: `git log --oneline -15`
Expected: Shows commits for all 10 tasks

**Step 7: Verify directory structure**

Run: `ls -la public/og-images/`
Expected: `.gitkeep` exists (ready for post images)

---

## Success Criteria

✓ BlogLayout title updated to "The Augur Blog"
✓ OG images auto-assigned from slug: `/og-images/[slug].png`
✓ BlogLayout passes ogImage through to Layout component
✓ Social share buttons (Twitter, LinkedIn, Email) on all blog posts
✓ Social share buttons include post URL and title
✓ RSS feed generated at `/rss.xml` with all posts
✓ Comprehensive blog documentation with:
  - Image size and format specifications
  - Step-by-step post creation guide
  - Image naming and storage instructions
  - Social sharing explanation
  - Troubleshooting section
  - Examples with and without images
✓ `public/og-images/` directory created and ready
✓ Build passes with no errors
✓ Typecheck passes with no errors
✓ RSS feed builds into dist/
✓ All tests passing
✓ Git history clean with 10 descriptive commits

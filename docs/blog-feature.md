# Blog Feature Documentation

The blog is built on Astro's content collections, allowing you to write posts as Markdown/MDX files with YAML frontmatter. Posts are automatically routed to `/blog/[slug]` with featured images, social sharing, and RSS feed support.

---

## Quick Start (For Authors)

Create a new blog post in 5 steps:

1. **Create directory**: `mkdir src/content/blog/my-post-title`
2. **Create post file**: `touch src/content/blog/my-post-title/index.mdx`
3. **Add frontmatter** (title, description, author, publishDate)
4. **Write content** in Markdown/MDX
5. **Add featured image**: `my-post-title/featured-image.webp` (1200×630)

That's it! Run `npm run dev` to preview.

---

## Author Guide

### Creating a Blog Post

#### Step 1: Create the post directory

```bash
mkdir src/content/blog/my-new-post
```

#### Step 2: Add frontmatter

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

#### Step 3: Write content

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

#### Step 4: Add featured image

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

**Additional inline images:**

You can add more images to the post directory with descriptive names:
- `architecture.webp`
- `timeline.webp`
- `content-image.webp`

Reference them in your MDX with relative paths:
```markdown
![Architecture diagram](./architecture.webp)
```

#### Step 5: Directory naming

Use kebab-case for directory names:
- ✓ `my-post-title/`
- ✓ `augur-update-2026/`
- ✗ `MyPostTitle/` or `my post title/`

The directory name becomes the URL slug:
- `generalizing-augur/index.mdx` → `/blog/generalizing-augur`

### Post Metadata Display

Posts automatically display:
- **Title**: From frontmatter
- **Author**: From frontmatter
- **Publish Date**: From `publishDate` frontmatter
- **Updated Date**: From `updatedDate` (if present)
- **Featured Image**: On blog listing cards (desktop: left sidebar, mobile: top)
- **Social Sharing**: Buttons to share on Twitter, LinkedIn, and via email
- **Navigation**: Links to next/previous posts

**Note:** Tags are included in frontmatter for RSS categorization but are not displayed on the page.

### Examples

#### Example 1: Simple post

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

#### Example 2: Post with JSX and multiple images

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

### Social Sharing

When you share a blog post on social media (Twitter, LinkedIn, Facebook), the platform automatically:
1. Pulls the post title from the page
2. Pulls the description
3. Pulls the featured image (auto-optimized from `featured-image.webp` at build time)
4. Displays a preview card

**No extra steps needed**: Your `featured-image.webp` in the post directory is automatically optimized for Open Graph (1200×630, WebP format) at build time and used for social sharing previews.

Each blog post has three share buttons:
- **Twitter**: Opens Twitter with pre-filled text
- **LinkedIn**: Opens LinkedIn share dialog
- **Email**: Opens email composer with post link and description

### RSS Feed

Your blog is automatically syndicated via RSS at: `/rss.xml`

The RSS feed includes:
- Post title, description, and link
- Publication date
- Author
- Categories (from tags)

---

## Architecture (For Developers)

### Overview

The blog feature provides a listing page (`/blog`) that displays blog posts with featured images and metadata. Blog posts are stored as Markdown/MDX files with co-located assets.

**What was built:**
- **Featured Images on Listing** - Blog post cards on `/blog` display featured images responsively (mobile: full-width top, desktop: 384×202px left sidebar)
- **Tags Removal** - Tags were removed from blog listing cards to simplify the display
- **Per-Directory Structure** - Blog posts reorganized from flat files to directories with co-located assets

### Directory Structure

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

### Design Decisions

#### 1. Per-Directory Blog Structure

**Decision:** Store each blog post as a directory containing `index.mdx` and all related images

**Why:**
- Easier for authors to locate and manage post assets (everything in one folder)
- Natural co-location of content and assets
- Supports semantic image naming without slug prefixes
- Enables future features (custom metadata files, related assets, etc.)

#### 2. Featured Image Naming

**Decision:** Name the listing image `featured-image.webp` consistently across all posts

**Why:**
- Semantic name immediately conveys purpose
- Enables static import via `import.meta.glob('/src/content/blog/*/featured-image.webp')`
- Same file used for both listing cards and OG image for social sharing
- Avoids ambiguous naming like `og-image.png` or numbered files

#### 3. Responsive Layout with Tailwind

**Decision:** Use flexbox with breakpoint-driven direction change

```astro
<article class="flex flex-col md:flex-row gap-0 md:gap-6">
  {/* Image: full-width on mobile, 384px sidebar on desktop */}
  {featuredImage && (
    <div class="w-full md:w-64 aspect-191/100">
      <Image src={featuredImage} alt={title} width={384} height={202} />
    </div>
  )}
  {/* Content: stack vertically */}
  <div>Title, metadata, description</div>
</article>
```

**Why:**
- Mobile-first approach: content stacks naturally on small screens
- Responsive without media query complexity
- Aspect ratio preserved for consistent visual appearance

#### 4. Astro Native Image Optimization

**Decision:** Use Astro's `<Image>` component with build-time optimization

**Why:**
- Astro generates optimized WebP versions at build time
- Produces significant file size reductions (50kB → 25kB typically)
- Works with bundled imports from `src/content/blog/`
- Type-safe imports with `ImageMetadata` type

### Technical Implementation

#### Static Image Import Pattern

Images are imported statically using `import.meta.glob()` in `src/pages/blog/index.astro`:

```typescript
import type { ImageMetadata } from 'astro';

// Import all featured images as static imports
const images = import.meta.glob('/src/content/blog/*/featured-image.webp', { eager: true });

// Create slug → image mapping
const imageMap = Object.entries(images).reduce((acc, [path, module]) => {
  const slug = path.split('/').at(-2); // Extract directory name
  acc[slug] = module.default;
  return acc;
}, {} as Record<string, ImageMetadata>);
```

This enables:
- **Type-safe imports:** `ImageMetadata` provides correct typing
- **Build-time optimization:** Astro can optimize all images during build
- **Dynamic patterns:** Works with any number of posts without code changes

#### OG Image Generation

In `src/pages/blog/[...slug].astro`:

```typescript
import { getImage } from 'astro:assets';

// Generate OG image from featured image at build time
const ogImage = featuredImage
  ? (await getImage({ src: featuredImage }, { width: 1200, height: 630, format: 'webp' })).src
  : undefined;
```

The featured image is automatically optimized for Open Graph meta tags at build time.

#### BlogPostCard Component

`src/components/BlogPostCard.astro` accepts an optional `featuredImage` prop:

```astro
interface Props {
  title: string;
  description?: string;
  author: string;
  publishDate: Date;
  slug: string;
  featuredImage?: ImageMetadata;
}
```

The component renders conditionally—posts without images display normally, posts with images display the responsive layout.

#### Content Collection Schema

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

### Important: Cloudflare Image Service Issue

#### What Happened

Initial deployment to Cloudflare Pages had broken images. The astro.config included:

```javascript
const cloudflareConfig = {
  adapter: cloudflare({
    imageService: "cloudflare"
  })
}
```

This told Astro to delegate image optimization to Cloudflare's API at runtime. However:
- Images imported from `src/` are bundled as hashed assets (`_astro/featured-image.[HASH].webp`)
- These bundled assets are **never exposed as public URLs** that Cloudflare's API can access
- Result: 404 errors for all images

#### The Fix

Removed the `imageService: "cloudflare"` configuration. Astro now handles optimization natively:
- Images are optimized at **build time** (not runtime)
- Optimized WebP files are generated and included in the deployment
- Works seamlessly with bundled imports
- No dependency on external APIs

---

## Development & Maintenance

### For Authors

#### Preview locally

```bash
npm run dev
```

Visit http://localhost:4321/blog to see your posts.

#### Build for production

```bash
npm run build
```

Posts are pre-rendered into static HTML at build time. RSS feed is generated in the output.

### For Developers

#### Adding New Blog Posts

1. Create directory: `src/content/blog/new-post-slug/`
2. Create post file: `src/content/blog/new-post-slug/index.mdx`
3. Add featured image: `src/content/blog/new-post-slug/featured-image.webp`
4. Reference images with relative paths: `![alt](./featured-image.webp)`
5. No code changes needed—listing page automatically includes new posts

#### Modifying Featured Image Dimensions

Featured images render at 384×202px. To change dimensions:
1. Update `width` and `height` props in `BlogPostCard.astro`
2. Update `aspect-191/100` Tailwind class to match new ratio (191:100 = 384:202)
3. Rebuild to regenerate optimized images

#### Image Optimization

Astro automatically generates optimized WebP versions for all images during build. Check build output to verify optimization (e.g., "50kB → 25kB").

---

## Troubleshooting

### For Authors

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

---

## Future Enhancements

Potential improvements without architectural changes:
- Add pagination to blog listing (currently shows all posts)
- Add filtering by tags (tags removed from display, but could be searchable)
- Add related posts section
- Add reading time estimate
- Add table of contents for longer posts

---

## Related Docs

- **Technical Architecture**: `docs/technical-architecture.md`
- **Astro Content Collections**: https://docs.astro.build/en/guides/content-collections/
- **RSS Feed**: `/rss.xml`

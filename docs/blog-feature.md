# Blog Feature Architecture

## Overview

The blog feature provides a listing page (`/blog`) that displays blog posts with featured images and metadata. Blog posts are stored as Markdown/MDX files with co-located assets.

## What Was Built

**Featured Images on Listing** - Blog post cards on `/blog` display featured images responsively:
- Mobile: Full-width image above content (flex column layout)
- Desktop: 384×202px image sidebar on left (flex row layout)

**Tags Removal** - Tags were removed from blog listing cards to simplify the display

**Per-Directory Structure** - Blog posts reorganized from flat files to directories with co-located assets for better author experience

## Design Decisions

### 1. Per-Directory Blog Structure

**Decision:** Store each blog post as a directory containing `index.mdx` and all related images

```
src/content/blog/
├── augurs-decade/
│   ├── index.mdx
│   ├── featured-image.webp
│   └── (other inline images as needed)
├── the-augur-lituus-whitepaper/
│   ├── index.mdx
│   ├── featured-image.webp
│   ├── architecture.webp
│   ├── history.webp
│   └── timeline.webp
```

**Why:**
- Easier for authors to locate and manage post assets (everything in one folder)
- Natural co-location of content and assets
- Supports semantic image naming without slug prefixes
- Enables future features (custom metadata files, related assets, etc.)

### 2. Featured Image Naming

**Decision:** Name the listing image `featured-image.webp` consistently across all posts

**Why:**
- Semantic name immediately conveys purpose
- Enables static import via `import.meta.glob('/src/content/blog/*/featured-image.webp')`
- First image becomes OG image for social sharing (same file used for both)
- Avoids ambiguous naming like `og-image.png` or numbered files

### 3. Responsive Layout with Tailwind

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

### 4. Astro Native Image Optimization

**Decision:** Use Astro's `<Image>` component with build-time optimization

```astro
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';

<Image
  src={featuredImage}
  alt={title}
  width={384}
  height={202}
  loading="lazy"
  class="w-full h-full object-cover"
/>
```

**Why:**
- Astro generates optimized WebP versions at build time
- Produces significant file size reductions (50kB → 25kB typically)
- Works with bundled imports from `src/content/blog/`
- Compatible with Cloudflare Pages server deployment
- Type-safe imports with `ImageMetadata` type

## Technical Implementation

### Static Image Import Pattern

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

### BlogPostCard Component

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

### Image References in Markdown

Blog posts use relative paths to reference images:

```markdown
# In src/content/blog/post-slug/index.mdx
![Alt text](./featured-image.webp)
![Architecture diagram](./architecture.webp)
```

Relative paths work because:
- Posts are stored as `post-slug/index.mdx`
- Images are in the same directory
- Markdown image loader resolves relative paths correctly

## Important: Cloudflare Image Service Issue

### What Happened

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

### The Fix

Removed the `imageService: "cloudflare"` configuration. Astro now handles optimization natively:
- Images are optimized at **build time** (not runtime)
- Optimized WebP files are generated and included in the deployment
- Works seamlessly with bundled imports
- No dependency on external APIs

## Maintenance Notes

### Adding New Blog Posts

1. Create directory: `src/content/blog/new-post-slug/`
2. Create post file: `src/content/blog/new-post-slug/index.mdx`
3. Add featured image: `src/content/blog/new-post-slug/featured-image.webp`
4. Reference images with relative paths: `![alt](./featured-image.webp)`
5. No code changes needed—listing page automatically includes new posts

### Image Optimization

Astro automatically generates optimized WebP versions for all images during build. Check build output to verify optimization (e.g., "50kB → 25kB").

### Modifying Featured Image Dimensions

Featured images render at 384×202px. To change dimensions:
1. Update `width` and `height` props in `BlogPostCard.astro`
2. Update `aspect-191/100` Tailwind class to match new ratio (191:100 = 384:202)
3. Rebuild to regenerate optimized images

## Files Involved

- `src/components/BlogPostCard.astro` - Renders individual blog cards with responsive layout
- `src/pages/blog/index.astro` - Listing page; imports and passes featured images
- `src/content/blog/*/index.mdx` - Blog post content (8 posts)
- `src/content/blog/*/featured-image.webp` - Featured images for listing and OG tags
- `astro.config.mjs` - Build configuration (removed Cloudflare imageService)

## Future Enhancements

Potential improvements without architectural changes:
- Add pagination to blog listing (currently shows all posts)
- Add filtering by tags (tags removed from display, but could be searchable)
- Add related posts section
- Add reading time estimate
- Add table of contents for longer posts

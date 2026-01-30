# Blog Listing with Responsive Featured Images Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure blog posts into per-directory format with featured images displayed responsively on listing (mobile: top, desktop: left sidebar) while removing tags from cards.

**Architecture:** Convert flat `.mdx` files to `post/index.mdx` structure with co-located featured images. Use Astro's `<Image>` component for build-time optimization. Import featured images statically via `import.meta.glob()` and pass to BlogPostCard which renders responsively with Tailwind.

**Tech Stack:** Astro 5.10+, TypeScript, Tailwind CSS, astro:assets Image component

---

### Task 1: Restructure blog posts to per-directory format

**Files:**
- Restructure: `src/content/blog/` from flat files to directories
- Move: All `.mdx` files to `[slug]/index.mdx`

**Step 1: Create directories for each blog post**

Run: `cd src/content/blog && ls *.mdx`
Expected: List of 8 mdx files

Create directories:
```bash
mkdir -p augurs-decade
mkdir -p the-augur-lituus-whitepaper
mkdir -p augur-cryptos-first-algorithmic-fork
mkdir -p augurs-rising
mkdir -p augurs-revival
mkdir -p augur-reboot-2025
mkdir -p generalized-augur
mkdir -p micahs-augur-fork
```

**Step 2: Move each mdx file to index.mdx in its directory**

Run:
```bash
mv augurs-decade.mdx augurs-decade/index.mdx
mv the-augur-lituus-whitepaper.mdx the-augur-lituus-whitepaper/index.mdx
mv augur-cryptos-first-algorithmic-fork.mdx augur-cryptos-first-algorithmic-fork/index.mdx
mv augurs-rising.mdx augurs-rising/index.mdx
mv augurs-revival.mdx augurs-revival/index.mdx
mv augur-reboot-2025.mdx augur-reboot-2025/index.mdx
mv generalized-augur.mdx generalized-augur/index.mdx
mv micahs-augur-fork.mdx micahs-augur-fork/index.mdx
```

**Step 3: Verify structure**

Run: `find src/content/blog -name "index.mdx" | wc -l`
Expected: 8

**Step 4: Commit**

```bash
git add src/content/blog/
git commit -m "refactor: restructure blog posts to per-directory format"
```

---

### Task 2: Move inline images from public/blog to post directories

**Files:**
- Move: Images from `public/blog/[slug]-N.webp` to `src/content/blog/[slug]/`

**Step 1: Move images for each post**

For each post, move its inline images:
```bash
# augurs-decade
mv public/blog/augurs-decade-1.webp src/content/blog/augurs-decade/

# the-augur-lituus-whitepaper (has 4 images)
mv public/blog/the-augur-lituus-whitepaper-1.webp src/content/blog/the-augur-lituus-whitepaper/
mv public/blog/the-augur-lituus-whitepaper-2.webp src/content/blog/the-augur-lituus-whitepaper/
mv public/blog/the-augur-lituus-whitepaper-3.webp src/content/blog/the-augur-lituus-whitepaper/
mv public/blog/the-augur-lituus-whitepaper-4.webp src/content/blog/the-augur-lituus-whitepaper/

# augur-cryptos-first-algorithmic-fork
mv public/blog/augur-cryptos-first-algorithmic-fork-1.webp src/content/blog/augur-cryptos-first-algorithmic-fork/

# augurs-rising
mv public/blog/augurs-rising-1.webp src/content/blog/augurs-rising/

# augurs-revival
mv public/blog/augurs-revival-1.webp src/content/blog/augurs-revival/

# augur-reboot-2025 (has 2 images)
mv public/blog/augur-reboot-2025-1.webp src/content/blog/augur-reboot-2025/
mv public/blog/augur-reboot-2025-2.webp src/content/blog/augur-reboot-2025/

# generalized-augur (has 2 images)
mv public/blog/generalized-augur-1.webp src/content/blog/generalized-augur/
mv public/blog/generalized-augur-2.webp src/content/blog/generalized-augur/

# micahs-augur-fork
mv public/blog/micahs-augur-fork-1.webp src/content/blog/micahs-augur-fork/
```

**Step 2: Verify public/blog is empty**

Run: `ls public/blog/`
Expected: (empty or no matching files)

**Step 3: Commit**

```bash
git add src/content/blog/
git commit -m "refactor: move inline images to post directories"
```

---

### Task 3: Rename numbered images to semantic names and add featured images

**Files:**
- Rename: `src/content/blog/[slug]/[number].webp` to semantic names
- Add: `featured-image.png` to each post (the first image serves as featured)

**Step 1: Rename images to semantic names for augurs-decade**

Read the post to understand what images are:
```bash
head -20 src/content/blog/augurs-decade/index.mdx
```

The first image is the featured image. Rename it:
```bash
mv src/content/blog/augurs-decade/augurs-decade-1.webp src/content/blog/augurs-decade/featured-image.webp
```

**Step 2: Rename images for the-augur-lituus-whitepaper**

Read to see image descriptions:
```bash
grep "!\[" src/content/blog/the-augur-lituus-whitepaper/index.mdx
```

Expected output shows 4 images. Rename them semantically:
```bash
# Based on content: architecture, oracle-design, history-timeline, revival
mv src/content/blog/the-augur-lituus-whitepaper/the-augur-lituus-whitepaper-1.webp src/content/blog/the-augur-lituus-whitepaper/featured-image.webp
mv src/content/blog/the-augur-lituus-whitepaper/the-augur-lituus-whitepaper-2.webp src/content/blog/the-augur-lituus-whitepaper/architecture.webp
mv src/content/blog/the-augur-lituus-whitepaper/the-augur-lituus-whitepaper-3.webp src/content/blog/the-augur-lituus-whitepaper/history.webp
mv src/content/blog/the-augur-lituus-whitepaper/the-augur-lituus-whitepaper-4.webp src/content/blog/the-augur-lituus-whitepaper/timeline.webp
```

**Step 3: Rename images for remaining posts**

```bash
# augur-cryptos-first-algorithmic-fork
mv src/content/blog/augur-cryptos-first-algorithmic-fork/augur-cryptos-first-algorithmic-fork-1.webp src/content/blog/augur-cryptos-first-algorithmic-fork/featured-image.webp

# augurs-rising
mv src/content/blog/augurs-rising/augurs-rising-1.webp src/content/blog/augurs-rising/featured-image.webp

# augurs-revival
mv src/content/blog/augurs-revival/augurs-revival-1.webp src/content/blog/augurs-revival/featured-image.webp

# augur-reboot-2025
mv src/content/blog/augur-reboot-2025/augur-reboot-2025-1.webp src/content/blog/augur-reboot-2025/featured-image.webp
mv src/content/blog/augur-reboot-2025/augur-reboot-2025-2.webp src/content/blog/augur-reboot-2025/content-image.webp

# generalized-augur
mv src/content/blog/generalized-augur/generalized-augur-1.webp src/content/blog/generalized-augur/featured-image.webp
mv src/content/blog/generalized-augur/generalized-augur-2.webp src/content/blog/generalized-augur/content-image.webp

# micahs-augur-fork
mv src/content/blog/micahs-augur-fork/micahs-augur-fork-1.webp src/content/blog/micahs-augur-fork/featured-image.webp
```

**Step 4: Verify all featured-images exist**

Run: `find src/content/blog -name "featured-image.webp" | wc -l`
Expected: 8

**Step 5: Commit**

```bash
git add src/content/blog/
git commit -m "refactor: rename images to semantic names with featured-image convention"
```

---

### Task 4: Update MDX files to use relative image paths

**Files:**
- Modify: `src/content/blog/*/index.mdx` (all blog posts)

**Step 1: Update augurs-decade image reference**

Edit `src/content/blog/augurs-decade/index.mdx`, change:
```markdown
![Augur Decade milestone](/blog/augurs-decade-1.webp)
```

To:
```markdown
![Augur Decade milestone](./featured-image.webp)
```

**Step 2: Update the-augur-lituus-whitepaper images**

Edit `src/content/blog/the-augur-lituus-whitepaper/index.mdx`, update all image references:
```markdown
# Change from:
![Augur Lituus Architecture](/blog/the-augur-lituus-whitepaper-2.webp)

# To:
![Augur Lituus Architecture](./architecture.webp)

# And similarly for other images
![Augurs and the Lituus](/blog/the-augur-lituus-whitepaper-3.webp)
# To:
![Augurs and the Lituus](./history.webp)

![Lituus Revival Timeline](/blog/the-augur-lituus-whitepaper-4.webp)
# To:
![Lituus Revival Timeline](./timeline.webp)
```

**Step 3: Update remaining posts**

For each file, replace image paths:
- `augur-cryptos-first-algorithmic-fork/index.mdx`: `/blog/augur-cryptos-first-algorithmic-fork-1.webp` → `./featured-image.webp`
- `augurs-rising/index.mdx`: `/blog/augurs-rising-1.webp` → `./featured-image.webp`
- `augurs-revival/index.mdx`: `/blog/augurs-revival-1.webp` → `./featured-image.webp`
- `augur-reboot-2025/index.mdx`: Update both images to `./featured-image.webp` and `./content-image.webp`
- `generalized-augur/index.mdx`: Update both images to `./featured-image.webp` and `./content-image.webp`
- `micahs-augur-fork/index.mdx`: `/blog/micahs-augur-fork-1.webp` → `./featured-image.webp`

**Step 4: Verify changes**

Run: `grep -r "/blog/" src/content/blog/*/index.mdx`
Expected: No output (all paths should be relative)

**Step 5: Commit**

```bash
git add src/content/blog/
git commit -m "refactor: update MDX image paths to relative paths"
```

---

### Task 5: Update BlogPostCard to display responsive featured image and remove tags

**Files:**
- Modify: `src/components/BlogPostCard.astro`

**Step 1: Read current BlogPostCard**

Run: `cat src/components/BlogPostCard.astro`
Expected: See current structure with title, metadata, description, tags

**Step 2: Update BlogPostCard props interface**

Edit `src/components/BlogPostCard.astro`, update the Props interface (around line 2-9):

Change from:
```astro
interface Props {
  title: string;
  description?: string;
  author: string;
  publishDate: Date;
  slug: string;
  tags?: string[];
}
```

To:
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

Add import at top:
```astro
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';
```

**Step 3: Update component destructuring**

Change line 11 from:
```astro
const { title, description, author, publishDate, slug, tags } = Astro.props;
```

To:
```astro
const { title, description, author, publishDate, slug, featuredImage } = Astro.props;
```

**Step 4: Update HTML structure for responsive layout**

Replace the entire article section (starting line 22). Replace:
```astro
<article class="blog-post-card border border-foreground/20 bg-background/70 p-6 hover:border-primary/50 transition-colors">
  <a href={`/blog/${slug}`} class="block">
    <div class="flex flex-col gap-3">
      {/* Post Title */}
      <h3 class="text-xl font-bold text-loud-foreground tracking-[0.125em] uppercase hover:fx-glow transition-all duration-200">
        {title}
      </h3>

      {/* Metadata */}
      <div class="flex gap-3 text-xs text-muted-foreground uppercase tracking-wider">
        <span>{formatDate(publishDate)}</span>
        <span>•</span>
        <span>BY {author}</span>
      </div>

      {/* Description */}
      {description && (
        <p class="text-foreground">
          {description}
        </p>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div class="flex gap-2 flex-wrap mt-2">
          {tags.map(tag => (
            <span class="px-2 py-1 border border-foreground/20 text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Read More */}
      <div class="text-primary text-sm font-bold uppercase tracking-wider mt-2">
        READ MORE →
      </div>
    </div>
  </a>
</article>
```

With:
```astro
<article class="blog-post-card border border-foreground/20 bg-background/70 hover:border-primary/50 transition-colors flex flex-col md:flex-row gap-0 md:gap-6">
  {/* Featured Image - responsive positioning */}
  {featuredImage && (
    <div class="w-full md:w-48 md:h-48 flex-shrink-0">
      <Image
        src={featuredImage}
        alt={title}
        width={200}
        height={105}
        loading="lazy"
        class="w-full h-full object-cover"
      />
    </div>
  )}

  {/* Content */}
  <a href={`/blog/${slug}`} class="block flex-1">
    <div class="flex flex-col gap-3 p-6">
      {/* Post Title */}
      <h3 class="text-xl font-bold text-loud-foreground tracking-[0.125em] uppercase hover:fx-glow transition-all duration-200">
        {title}
      </h3>

      {/* Metadata */}
      <div class="flex gap-3 text-xs text-muted-foreground uppercase tracking-wider">
        <span>{formatDate(publishDate)}</span>
        <span>•</span>
        <span>BY {author}</span>
      </div>

      {/* Description */}
      {description && (
        <p class="text-foreground">
          {description}
        </p>
      )}

      {/* Read More */}
      <div class="text-primary text-sm font-bold uppercase tracking-wider mt-2">
        READ MORE →
      </div>
    </div>
  </a>
</article>
```

**Step 5: Verify syntax**

Run: `npm run typecheck`
Expected: PASS - no TypeScript errors

**Step 6: Commit**

```bash
git add src/components/BlogPostCard.astro
git commit -m "feat: add responsive featured image to BlogPostCard and remove tags"
```

---

### Task 6: Update blog listing page to import and pass featured images

**Files:**
- Modify: `src/pages/blog/index.astro`

**Step 1: Read current page**

Run: `cat src/pages/blog/index.astro`
Expected: See current structure with BlogPostCard rendering

**Step 2: Add featured image imports**

Edit `src/pages/blog/index.astro`, add after the imports section (around line 10):

```astro
// Import featured images from all blog posts
const images = import.meta.glob('/src/content/blog/*/featured-image.webp', { eager: true });

// Create a map from slug to image object
const imageMap = Object.entries(images).reduce((acc, [path, module]) => {
  const slug = path.split('/').at(-2);
  acc[slug] = module.default;
  return acc;
}, {} as Record<string, ImageMetadata>);
```

Add import at the top:
```astro
import type { ImageMetadata } from 'astro';
```

**Step 3: Update BlogPostCard calls to pass featured image and remove tags**

Find the line where BlogPostCard is rendered (around line 47-54), change from:
```astro
{sortedPosts.map((post) => (
  <BlogPostCard
    title={post.data.title}
    description={post.data.description}
    author={post.data.author}
    publishDate={post.data.publishDate}
    slug={post.slug}
    tags={post.data.tags}
  />
))}
```

To:
```astro
{sortedPosts.map((post) => (
  <BlogPostCard
    title={post.data.title}
    description={post.data.description}
    author={post.data.author}
    publishDate={post.data.publishDate}
    slug={post.slug}
    featuredImage={imageMap[post.slug]}
  />
))}
```

**Step 4: Verify changes**

Run: `grep -n "BlogPostCard" src/pages/blog/index.astro`
Expected: Shows updated component with featuredImage prop

**Step 5: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "feat: import and pass featured images to blog listing cards"
```

---

### Task 7: Typecheck and build verification

**Files:**
- Test: TypeScript compilation and build

**Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: PASS - no TypeScript errors

**Step 2: Run build**

Run: `npm run build`
Expected: PASS - build completes successfully with no errors

**Step 3: Verify build output contains optimized images**

Run: `ls -lh dist/ | head -20`
Expected: See dist folder with static files

**Step 4: Verify no errors in stdout**

Output should show:
```
✓ Completed in [time]
```

**Step 5: Commit any auto-fixes (if typecheck/build modified files)**

Run: `git status`
If there are changes:
```bash
git add .
git commit -m "fix: resolve build and typecheck issues"
```

If clean, skip this step.

---

### Task 8: Manual verification in dev mode

**Files:**
- Test: Blog listing and individual blog pages

**Step 1: Check for dev server conflicts**

Run: `lsof -ti:4321`
Expected: Empty output (port is free)

If occupied, run: `kill -9 $(lsof -ti:4321)`

**Step 2: Start dev server**

Run: `npm run dev`
Expected: Server starts on http://localhost:4321

**Step 3: Visit blog listing**

Navigate to: http://localhost:4321/blog
Expected:
- Featured images display on all blog cards
- Images stack on mobile (full width on top)
- Images appear as sidebar on desktop (left side, ~200px wide)
- No tags displayed on cards
- "READ MORE" links work
- Page loads quickly without broken images

**Step 4: Visit individual blog post**

Navigate to: http://localhost:4321/blog/augurs-decade
Expected:
- Post content displays correctly
- Relative image paths resolve (inline images show correctly)
- Page loads without 404s for images
- Social share buttons present (from existing feature)

**Step 5: Check browser console**

Press F12 and look at Console tab
Expected: No errors or warnings related to images

**Step 6: Stop dev server**

Run: Ctrl+C

---

### Task 9: Final commit and summary

**Files:**
- Verify: Git history and working tree

**Step 1: Check git log**

Run: `git log --oneline -10`
Expected: See all 8 commits from previous tasks in order

**Step 2: Verify working tree is clean**

Run: `git status`
Expected: `nothing to commit, working tree clean`

**Step 3: Create summary commit (optional)**

If desired, create a summary:
```bash
git log --oneline feature/blogging...main | wc -l
```

This shows how many commits are on this feature branch.

---

## Success Criteria

✓ All 8 blog posts restructured to `post/index.mdx` format
✓ Featured images named `featured-image.webp` in each post directory
✓ Inline images renamed semantically and placed in post directories
✓ All MDX files updated with relative image paths (no `/blog/` absolute paths)
✓ BlogPostCard component accepts `featuredImage` prop (ImageMetadata type)
✓ BlogPostCard removes tags section entirely
✓ BlogPostCard displays featured image responsively (column on mobile, row on desktop)
✓ Featured image uses Astro `<Image>` component for optimization
✓ Blog listing page imports featured images via `import.meta.glob()`
✓ Blog listing passes featured images to all BlogPostCard components
✓ Typecheck passes with no errors
✓ Build passes with no errors
✓ Dev server loads blog listing and individual posts correctly
✓ No broken image references
✓ All changes committed with clear messages

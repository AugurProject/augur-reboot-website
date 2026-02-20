# Blog Preview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a blog preview section to the homepage displaying the latest blog post prominently with two smaller companion posts below, using responsive CSS layout.

**Architecture:** Self-contained Astro component (`BlogPreview.astro`) that fetches blog data, formats images, and renders responsive layout. Integrated into index.astro between HeroBanner and Footer. No API calls or dynamic routes—purely static content at build time.

**Tech Stack:** Astro 5.10+, Tailwind CSS v4, React 19 (not needed for this component), Astro Image component

---

## Task 1: Create BlogPreview.astro Component Structure

**Files:**
- Create: `src/components/BlogPreview.astro`

**Step 1: Create the component file with frontmatter**

Create `src/components/BlogPreview.astro` with the following content:

```astro
---
import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { Image } from 'astro:assets';
import { withBase } from '../lib/utils';

// Import featured images from all blog posts
const images = import.meta.glob('/src/content/blog/*/featured-image.webp', { eager: true });

// Create a map from slug to image object
const imageMap = Object.entries(images).reduce((acc, [path, module]) => {
  const slug = path.split('/').at(-2);
  acc[slug] = module.default;
  return acc;
}, {} as Record<string, ImageMetadata>);

// Get all blog posts
const allPosts = await getCollection('blog');

// Sort by publish date (newest first) and take first 3
const blogPosts = allPosts
  .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
  .slice(0, 3);

// Extract featured and secondary posts
const featuredPost = blogPosts[0];
const secondaryPosts = blogPosts.slice(1, 3);

const featuredImage = featuredPost ? imageMap[featuredPost.slug] : undefined;
const secondaryImages = secondaryPosts.map(post => ({
  post,
  image: imageMap[post.slug]
}));
---

<!-- Component will be added in next steps -->
```

**Step 2: Verify the file is created**

Check that `src/components/BlogPreview.astro` exists and contains the frontmatter code. The file should be at:
```
/Users/jubalm/Projects/@lituus/augur-reboot-website/.worktrees/feature-blogging/src/components/BlogPreview.astro
```

**Expected outcome:** Component file created with data fetching logic ready. No errors when checking TypeScript compilation.

---

## Task 2: Build Featured Post Section

**Files:**
- Modify: `src/components/BlogPreview.astro` (template section)

**Step 1: Add the featured post HTML to BlogPreview.astro**

Replace the comment `<!-- Component will be added in next steps -->` with:

```astro
<section class="py-12 md:py-16 px-4 md:px-8">
  <div class="max-w-5xl mx-auto">
    <!-- Section Title -->
    <h2 class="text-3xl md:text-4xl font-bold uppercase mb-8 md:mb-12 text-center">
      The Augur Arc
    </h2>

    <!-- Blog Preview Container -->
    <div class="flex flex-col gap-8 md:gap-12">
      {/* Featured Post */}
      {featuredPost && (
        <article class="featured-post flex flex-col gap-4 md:gap-6">
          {/* Featured Image */}
          {featuredImage && (
            <div class="w-full overflow-hidden rounded">
              <Image
                src={featuredImage}
                alt={featuredPost.data.title}
                width={1200}
                height={630}
                class="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Featured Post Content */}
          <div class="flex flex-col gap-3">
            <h3 class="text-2xl md:text-3xl font-bold">
              {featuredPost.data.title}
            </h3>
            <p class="text-base md:text-lg text-foreground/80">
              {featuredPost.data.description}
            </p>
            <div class="flex gap-4 text-sm text-foreground/60">
              <span>{featuredPost.data.author}</span>
              <span>
                {featuredPost.data.publishDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <a
              href={withBase(`/blog/${featuredPost.slug}`)}
              class="text-base font-semibold text-loud-foreground hover:fx-glow transition-colors"
            >
              Read more →
            </a>
          </div>
        </article>
      )}
    </div>
  </div>
</section>
```

**Step 2: Verify featured post renders**

Check that featured post shows title, description, image, author, date, and link. The Astro `<Image>` component should optimize the featured image.

**Expected outcome:** Featured post section displays properly with responsive image and readable text.

---

## Task 3: Build Secondary Posts Grid

**Files:**
- Modify: `src/components/BlogPreview.astro` (add secondary posts section)

**Step 1: Add secondary posts HTML after the featured post**

Inside the closing `</div>` of the blog preview container (after the featured post `</article>` closing tag), add:

```astro
      {/* Secondary Posts Grid */}
      {secondaryPosts.length > 0 && (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {secondaryImages.map(({ post, image }) => (
            <article class="secondary-post flex flex-col md:flex-row gap-4 h-full">
              {/* Post Image */}
              {image && (
                <div class="w-full md:w-48 aspect-square md:flex-shrink-0 overflow-hidden rounded">
                  <Image
                    src={image}
                    alt={post.data.title}
                    width={200}
                    height={200}
                    class="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Post Content */}
              <div class="flex flex-col justify-between gap-2 flex-1">
                <div>
                  <h4 class="text-lg md:text-xl font-bold mb-2">
                    {post.data.title}
                  </h4>
                  <p class="text-sm md:text-base text-foreground/80 line-clamp-2">
                    {post.data.description}
                  </p>
                </div>
                <div class="flex gap-2 text-xs text-foreground/60">
                  <span>{post.data.author}</span>
                  <span>
                    {post.data.publishDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <a
                  href={withBase(`/blog/${post.slug}`)}
                  class="text-sm font-semibold text-loud-foreground hover:fx-glow transition-colors"
                >
                  Read →
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
```

**Step 2: Verify secondary posts render**

Check that two smaller posts appear below the featured post:
- Mobile: stacked vertically with left image and right text
- Desktop (md breakpoint): 2-column grid layout

**Expected outcome:** Secondary posts display in responsive grid with correct image aspect ratio and readable text.

---

## Task 4: Add "View All Posts" Link

**Files:**
- Modify: `src/components/BlogPreview.astro` (add view all section)

**Step 1: Add view all link after the blog grid**

After the closing `</div>` of the secondary posts grid, add:

```astro
      {/* View All Link */}
      <div class="flex justify-center pt-4 md:pt-6">
        <a
          href={withBase('/blog')}
          class="text-base md:text-lg font-semibold text-loud-foreground hover:fx-glow transition-colors"
        >
          View all posts →
        </a>
      </div>
```

**Step 2: Verify "View all posts" link**

The link should:
- Center align on the page
- Use the same styling as post links (`loud-foreground` color, `fx-glow` hover)
- Link to `/blog` page

**Expected outcome:** "View all posts" link appears below secondary posts and navigates correctly.

---

## Task 5: Integrate BlogPreview into Homepage

**Files:**
- Modify: `src/pages/index.astro:1-31`

**Step 1: Add BlogPreview import**

At the top of the frontmatter in `src/pages/index.astro`, add the import after the other imports:

```astro
import BlogPreview from '../components/BlogPreview.astro';
```

Full import section should look like:
```astro
---
import Layout from '../layouts/Layout.astro';
import Intro from '../components/Intro.tsx';
import HeroBanner from '../components/HeroBanner.astro';
import BlogPreview from '../components/BlogPreview.astro';
import Footer from '../components/Footer.astro';
---
```

**Step 2: Add BlogPreview component to template**

In the `<Layout>` template, add `<BlogPreview />` between `<HeroBanner />` and `<Footer />`:

```astro
<Layout
  title="Augur is Rebooting - The Frontier of Prediction Markets"
  description="Augur, the world's most advanced decentralized prediction market platform, is rebooting with next-generation oracle technology and enhanced forecasting capabilities."
  ogType="website"
  keywords={[
    "augur",
    "prediction markets",
    "blockchain",
    "oracles",
    "decentralized finance",
    "forecasting",
    "REP token",
    "cryptocurrency",
    "defi",
    "web3",
    "ethereum",
    "rebooting",
    "next generation"
  ]}
>
  <Intro client:only="react" />
  <HeroBanner />
  <BlogPreview />
  <Footer />
</Layout>
```

**Step 3: Verify integration**

Check that the component imports without errors and the TypeScript compilation succeeds:
```bash
npm run typecheck
```

**Expected outcome:** index.astro imports and integrates BlogPreview successfully. No TypeScript errors.

---

## Task 6: Test the Implementation

**Files:**
- View: `src/components/BlogPreview.astro`
- View: `src/pages/index.astro`

**Step 1: Start dev server**

Run the development server:
```bash
npm run dev
```

Wait for the server to start. You should see output like:
```
Local    http://localhost:4321/
```

**Step 2: Test mobile layout**

1. Navigate to `http://localhost:4321/`
2. Wait for the intro animation (or skip with Escape)
3. Scroll down past the fork meter
4. Verify:
   - Section title "THE AUGUR ARC" is visible
   - Featured post displays full-width with image on top, text below
   - Two secondary posts stack vertically below featured post
   - Each secondary post has left image (square) and right text
   - All images load correctly
   - Post titles, descriptions, authors, dates are readable
   - "Read more" and "Read" links are visible
   - "View all posts" link appears at the bottom

**Step 3: Test desktop layout**

1. Resize browser to 1024px+ width (or use DevTools responsive mode)
2. Verify:
   - Featured post still full-width with larger image
   - Two secondary posts appear side-by-side in 2-column grid
   - Each secondary post: left image (square, flex-shrink), right text
   - Proper spacing and alignment
   - No horizontal scrolling

**Step 4: Test responsive breakpoint**

1. Resize from desktop (1024px) to mobile (375px) gradually
2. Verify layout smoothly transitions:
   - Secondary posts grid changes from 2-col to 1-col at md breakpoint (768px)
   - No jumping or misalignment
   - Images maintain aspect ratio
   - Text remains readable at all sizes

**Step 5: Test links**

1. Click on featured post title/link → should navigate to featured post page
2. Click on secondary post link → should navigate to that post page
3. Click "View all posts" → should navigate to `/blog` listing page

**Step 6: Test with missing data**

Verify edge cases (these should gracefully handle):
- If a post has no featured image (shouldn't happen with current validation, but good to check)
- If there are fewer than 3 posts (secondary posts grid shouldn't show if <2 posts)

**Expected outcome:** All visual, responsive, and link tests pass. Component works correctly on mobile and desktop.

---

## Task 7: Typecheck and Lint

**Files:**
- Check: All modified files

**Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected output:
```
src/pages/index.astro
src/components/BlogPreview.astro
✓ No TypeScript errors
```

**Step 2: Run lint**

```bash
npm run lint
```

Expected output:
```
✓ All files passed
```

If there are lint errors, fix them (usually formatting):
```bash
npx @biomejs/biome format --write src/components/BlogPreview.astro
```

**Expected outcome:** No TypeScript or linting errors.

---

## Task 8: Build and Verify Production Output

**Files:**
- Build output: `dist/`

**Step 1: Run production build**

```bash
npm run build
```

Expected output should show:
- No errors
- `dist/` folder created
- All pages pre-rendered including `/` (homepage)
- Images optimized (look for output like "featured-image.webp → optimized-hash.webp")

**Step 2: Verify build artifacts**

Check the build output for:
- `dist/index.html` exists (homepage)
- `dist/blog/index.html` exists (blog listing)
- `dist/_astro/` folder contains optimized images

**Step 3: Test production build locally**

```bash
npm run preview
```

Navigate to `http://localhost:3000/` and verify:
- BlogPreview section renders correctly
- Images load from optimized assets
- Links work correctly
- Responsive layout still works

**Expected outcome:** Production build succeeds with no errors and optimized images included.

---

## Task 9: Commit Changes

**Files:**
- Created: `src/components/BlogPreview.astro`
- Modified: `src/pages/index.astro`

**Step 1: Check git status**

```bash
git status
```

Expected output should show:
```
Untracked files:
  src/components/BlogPreview.astro

Modified files:
  src/pages/index.astro
```

**Step 2: Stage files**

```bash
git add src/components/BlogPreview.astro src/pages/index.astro
```

**Step 3: Create commit**

```bash
git commit -m "feat: add blog preview section to homepage

- Create BlogPreview.astro component with self-contained data fetching
- Display latest blog post prominently with featured image
- Display 2 secondary posts in responsive layout
- Add 'View all posts' link to blog listing
- Responsive CSS: mobile stacked layout, desktop 2-column grid
- Integrate into homepage between HeroBanner and Footer"
```

**Step 4: Verify commit**

```bash
git log --oneline -1
```

Should show your new commit.

**Expected outcome:** Changes committed successfully with descriptive message.

---

## Success Criteria Verification

After completing all tasks, verify:

- ✅ BlogPreview.astro component created at correct path
- ✅ Component fetches and sorts blog posts correctly (newest first)
- ✅ Featured image imported and optimized
- ✅ Secondary images imported and optimized
- ✅ Featured post renders with full-width image and text
- ✅ Secondary posts render in responsive grid (1-col mobile, 2-col desktop)
- ✅ "THE AUGUR ARC" title displays above posts
- ✅ Post metadata (title, description, author, date) displays correctly
- ✅ All links work and navigate correctly
- ✅ "View all posts" link appears and works
- ✅ No TypeScript or linting errors
- ✅ Production build succeeds with optimized images
- ✅ Changes committed to git

---

## Rollback Instructions

If you need to undo these changes:

```bash
# Undo the commit
git reset --soft HEAD~1

# Discard changes to index.astro
git checkout src/pages/index.astro

# Remove the new component file
rm src/components/BlogPreview.astro

# Verify clean state
git status
```

---

## Notes for Implementation

1. **Image Optimization:** The Astro `<Image>` component automatically optimizes images at build time. No manual optimization needed.

2. **Responsive Classes:** All breakpoints use Tailwind's `md:` prefix (768px breakpoint). No custom media queries.

3. **withBase() utility:** Used for all internal links to support base path deployments (e.g., GitHub Pages).

4. **line-clamp-2:** Truncates secondary post descriptions to 2 lines for consistent visual appearance. Adjust if needed.

5. **aspect-ratio:** Featured image uses `aspect-video` (16:9 equivalent), secondary images use `aspect-square` (1:1).

6. **Text sizing:** Uses Tailwind `text-base` (default 1rem) and `text-sm` (0.875rem) for appropriate hierarchy.

7. **Hover effects:** Uses existing `fx-glow` custom utility (defined in global.css) for consistency with site design.

8. **Date formatting:** Dates formatted with `toLocaleDateString()` for locale-aware display (featured: full date, secondary: abbreviated).

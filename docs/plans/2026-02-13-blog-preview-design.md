# Blog Preview Component Design

**Date:** 2026-02-13
**Feature:** Add blog preview section to homepage
**Status:** Design approved, ready for implementation

---

## Overview

Add a "Blog Preview" section to the main homepage that showcases the latest blog posts. The section displays one featured post (newest) with two smaller companion posts beneath it, with responsive layout that adapts from mobile to desktop.

---

## User Intent

Increase visibility of blog content on the homepage and drive traffic to the blog section without requiring users to navigate away from the main page.

---

## Design Decisions

### 1. Self-Contained Component

**Decision:** Create `BlogPreview.astro` as a single, self-contained component that handles data fetching and rendering.

**Why:**
- Encapsulated: can be dropped into any page with one line
- Reusable: minimal coupling to index.astro
- Easy to iterate: all logic in one place
- Future-proof: can refactor data fetching later if needed

### 2. Responsive Layout Strategy

**Mobile (default):**
- Featured post: full-width with image on top, text below
- Smaller posts: stacked vertically, left image + right text layout

**Desktop (md breakpoint and up):**
- Featured post: full-width with larger aspect ratio
- Smaller posts: 2-column grid, each 50% width, left image + right text

**Implementation:** Flexbox and CSS Grid with Tailwind breakpoints. No hidden elements—all content in DOM, responsive reflow via CSS.

### 3. Section Title

**Decision:** Use "THE AUGUR ARC" as section title (same as blog listing page).

**Why:**
- Consistent branding with `/blog` page
- Easy to change later without code modifications
- Reinforces blog as part of the brand narrative

### 4. "View All" Link

**Decision:** Place a "View all posts" link at the bottom of the section, linking to `/blog`.

**Why:**
- Clear call-to-action for users who want to explore more posts
- Drives traffic to full blog listing
- Consistent with common content section patterns

---

## Technical Approach

### Data Flow

```
BlogPreview.astro
├─ getCollection('blog') → fetch all posts
├─ import.meta.glob('/src/content/blog/*/featured-image.webp') → load images
├─ Sort posts by publishDate (newest first)
├─ Take first 3 posts
└─ Render to template
```

### Component Structure

**File:** `src/components/BlogPreview.astro`

**Responsibilities:**
- Import `getCollection()` from Astro content API
- Import featured images using glob pattern (reuses blog listing approach)
- Sort posts by date, take top 3
- Render featured post (1) and smaller posts (2)
- Include responsive layout and "View all" link

### HTML Structure

```astro
<section class="blog-preview">
  <h2>THE AUGUR ARC</h2>

  <div class="blog-preview-container">
    {/* Featured Post */}
    <article class="featured-post">
      <img src={featuredImage} />
      <div class="content">
        <h3>{title}</h3>
        <p>{description}</p>
        <a href={postLink}>Read more</a>
      </div>
    </article>

    {/* Two Smaller Posts */}
    <div class="smaller-posts">
      <article class="small-post">
        {/* Post 2 */}
      </article>
      <article class="small-post">
        {/* Post 3 */}
      </article>
    </div>
  </div>

  <a class="view-all" href="/blog">View all posts</a>
</section>
```

### Responsive CSS Pattern

**Tailwind approach:**
- Featured post: `flex flex-col gap-4 md:gap-6`
- Featured image: `w-full aspect-video object-cover`
- Smaller posts container: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Small post: `flex flex-col md:flex-row gap-4`
- Small post image: `w-full md:w-48 aspect-square object-cover flex-shrink-0`

**Key principle:** No `display: none` or `visibility: hidden`. Layout reflows via flexbox direction change and grid column count.

### Integration

**File:** `src/pages/index.astro`

Add import and component call:
```astro
import BlogPreview from '../components/BlogPreview.astro';

// In template, between HeroBanner and Footer:
<HeroBanner />
<BlogPreview />
<Footer />
```

---

## Styling Details

### Typography

- Section title: Consistent with other headings on page (uppercase, bordered or prominent)
- Featured post title: Larger, bold, prominent
- Featured post description: Body text, good contrast
- Small post titles: Smaller than featured, still readable
- Small post descriptions: Truncated or brief

### Spacing

- Gap between featured and smaller posts: 6 units (24px) on desktop, 4 units (16px) on mobile
- Padding around section: consistent with page padding (8 units / 32px)
- Gap between image and text: 4 units (16px)

### Images

- Featured image: aspect-video (16:9) or 1200×630 (OG ratio)
- Small post images: aspect-square (1:1) to maintain visual balance
- All images: `object-cover` to fill container without distortion
- Use Astro `<Image>` component for optimization

---

## Future Enhancements

Without architectural changes:
- Add author name to smaller posts
- Add publish date badges
- Add "Read time" estimate
- Highlight "trending" or "popular" posts instead of just "newest"
- Add category/tag badges
- Animate on scroll (fade-in as user scrolls down)

---

## Testing Checklist

- [ ] Component renders without errors
- [ ] Mobile layout: featured post full-width, smaller posts stacked
- [ ] Desktop layout: featured full-width, smaller posts in 2-column grid
- [ ] Images load and display correctly
- [ ] Links to individual posts work
- [ ] "View all posts" link works and goes to `/blog`
- [ ] Title and "View all" link align with page styling
- [ ] No horizontal scrolling on any viewport size
- [ ] Responsive breakpoint at md (768px) works smoothly
- [ ] Blog posts with and without featured images (edge case)

---

## Success Criteria

✅ Blog preview section appears on homepage below fork meter
✅ Displays latest blog post prominently
✅ Displays 2 secondary posts in responsive layout
✅ Responsive CSS handles mobile and desktop without hidden elements
✅ Links work correctly to individual posts and blog listing
✅ Styling is consistent with existing homepage design
✅ Component is self-contained and reusable

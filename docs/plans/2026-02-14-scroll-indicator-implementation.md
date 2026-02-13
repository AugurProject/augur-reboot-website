# Scroll Indicator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a retro-styled animated arrow-down keycap scroll indicator in the lower right corner of the homepage.

**Architecture:** Create a React component (ScrollIndicator.tsx) that listens to scroll events and manages visibility state. Use CSS animations in global.css for the keycap press/release effect. Integrate into HeroBanner with `client:idle` hydration directive.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, CSS Keyframes

---

## Task 1: Create ScrollIndicator Component Structure

**Files:**
- Create: `src/components/ScrollIndicator.tsx`

**Step 1: Create the component file with basic JSX structure**

Create `src/components/ScrollIndicator.tsx`:

```typescript
import { useState, useEffect } from 'react';

export const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Scroll listener will be added in next task

    return () => {
      // Cleanup will be added in next task
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-10">
      <div className="scroll-indicator-keycap">
        ↓
      </div>
    </div>
  );
};
```

**Step 2: Verify component structure is created**

Check that `src/components/ScrollIndicator.tsx` exists with the basic component structure.

**Expected outcome:** Component file created with basic JSX structure, no errors when checking TypeScript compilation.

---

## Task 2: Add Scroll Event Listener Logic

**Files:**
- Modify: `src/components/ScrollIndicator.tsx`

**Step 1: Add scroll event listener with throttling**

Replace the existing useEffect with scroll listener logic:

```typescript
import { useState, useEffect } from 'react';

export const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      // Clear existing timeout if any
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Use requestAnimationFrame for better performance
      scrollTimeout = setTimeout(() => {
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;

        // Show indicator only when scrollY is less than viewport height
        const shouldBeVisible = scrollY < viewportHeight;
        setIsVisible(shouldBeVisible);
      }, 10);
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);

    // Initialize visibility on mount
    handleScroll();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  return (
    <div className={`fixed bottom-8 right-8 z-10 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="scroll-indicator-keycap">
        ↓
      </div>
    </div>
  );
};
```

**Step 2: Verify scroll listener works**

The component now:
- Listens to scroll events
- Calculates visibility based on scrollY < viewportHeight
- Updates visibility state
- Applies transition-opacity class for smooth fade
- Cleans up event listener on unmount

**Expected outcome:** ScrollIndicator component has functional scroll logic with proper cleanup.

---

## Task 3: Add Keycap Styling

**Files:**
- Modify: `src/components/ScrollIndicator.tsx` (className update)

**Step 1: Update component with Tailwind styling**

Replace the scroll indicator div with styled content:

```typescript
import { useState, useEffect } from 'react';

export const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      scrollTimeout = setTimeout(() => {
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        const shouldBeVisible = scrollY < viewportHeight;
        setIsVisible(shouldBeVisible);
      }, 10);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  return (
    <div className={`fixed bottom-8 right-8 z-10 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="scroll-indicator-keycap flex items-center justify-center w-14 h-14 border-2 border-primary text-primary text-2xl font-mono cursor-default">
        ↓
      </div>
    </div>
  );
};
```

**Step 2: Verify styling classes are applied**

The keycap now has:
- Width/height: 56px (w-14 h-14)
- Border: 2px solid primary color (#2AE7A8)
- Text: centered arrow, primary color
- Font: monospace, size 24px
- Flex centering for arrow alignment

**Expected outcome:** Keycap appears as a green bordered square with centered arrow in lower right corner.

---

## Task 4: Add CSS Animations to global.css

**Files:**
- Modify: `src/styles/global.css`

**Step 1: Add keycap press animation keyframes**

Add these keyframes to the end of `src/styles/global.css` (before or after other animation definitions):

```css
@keyframes keycap-press {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}

.scroll-indicator-keycap {
  animation: keycap-press 1.3s ease-in-out infinite;
}
```

**Step 2: Verify animation is applied**

The animation:
- Runs infinitely
- Duration: 1.3 seconds
- Easing: ease-in-out for smooth press/release
- Transform: moves down 10px at midpoint (press), back to 0 at start/end (release)

**Expected outcome:** Keycap animates with a pressing motion continuously.

---

## Task 5: Integrate ScrollIndicator into HeroBanner

**Files:**
- Modify: `src/components/HeroBanner.astro`

**Step 1: Add ScrollIndicator import**

At the top of the HeroBanner frontmatter (after other imports), add:

```astro
import { ScrollIndicator } from './ScrollIndicator';
```

Full import section should include:

```astro
---
import AugurLogo from '../assets/augur.svg';
import ForkMonitor from './ForkMonitor.tsx';
import SocialLinks from './SocialLinks.astro';
import { ScrollIndicator } from './ScrollIndicator';
import { withBase } from '../lib/utils';
---
```

**Step 2: Add ScrollIndicator component to template**

After the closing `</div>` of `#hero-banner-container` (at the end of the template), add:

```astro
<ScrollIndicator client:idle />
```

Full structure should be:

```astro
<div class="h-screen min-h-fit w-full relative">
  <div id="hero-banner-container" class="...">
    {/* existing content */}
  </div>
</div>

<ScrollIndicator client:idle />
```

**Step 3: Verify integration**

- ScrollIndicator imports without errors
- Component appears in lower right corner when viewing homepage
- TypeScript compilation succeeds

**Expected outcome:** ScrollIndicator component integrated and rendering in HeroBanner.

---

## Task 6: Test the Implementation

**Files:**
- View: `src/components/ScrollIndicator.tsx`
- View: `src/components/HeroBanner.astro`
- View: `src/styles/global.css`

**Step 1: Start dev server**

```bash
npm run dev
```

Wait for the development server to start. You should see output like:
```
Local    http://localhost:4321/
```

**Step 2: Test on homepage (desktop)**

1. Navigate to `http://localhost:4321/`
2. Wait for intro animation to complete (or press Escape to skip)
3. Verify:
   - Scroll indicator appears in lower right corner
   - Keycap is green bordered square with ↓ arrow
   - Arrow animates continuously (press/release motion)
   - Indicator is visible when at top of page

**Step 3: Test scroll behavior**

1. Scroll down the page slowly
2. Verify:
   - Indicator smoothly fades out (opacity transition) as you scroll past viewport height
   - Indicator is not visible when scrollY > viewport height
   - Scroll back to top: indicator fades back in
   - No janky animation or performance issues

**Step 4: Test on mobile**

1. Open DevTools (F12)
2. Toggle device toolbar (responsive design mode)
3. Test viewport sizes: 375px, 425px, 768px widths
4. Verify:
   - Indicator stays in lower right corner on all sizes
   - Doesn't overlap critical content
   - Positioning remains correct (32px from bottom and right edges)

**Step 5: Test animation smoothness**

1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Start recording, scroll page, stop recording
4. Verify:
   - No long tasks blocking main thread
   - Smooth 60fps animation (no drops)
   - Scroll listener isn't causing jank

**Step 6: Test typecheck and lint**

```bash
npm run typecheck
```

Expected: No TypeScript errors

```bash
npm run lint
```

Expected: No new linting errors (pre-existing warnings OK)

**Expected outcome:** All tests pass, component works smoothly across desktop and mobile.

---

## Task 7: Commit Changes

**Files:**
- Created: `src/components/ScrollIndicator.tsx`
- Modified: `src/components/HeroBanner.astro`
- Modified: `src/styles/global.css`

**Step 1: Check git status**

```bash
git status
```

Expected output should show:
```
Untracked files:
  src/components/ScrollIndicator.tsx

Modified files:
  src/components/HeroBanner.astro
  src/styles/global.css
```

**Step 2: Stage files**

```bash
git add src/components/ScrollIndicator.tsx src/components/HeroBanner.astro src/styles/global.css
```

**Step 3: Create commit**

```bash
git commit -m "feat: add animated scroll indicator keycap

- Create ScrollIndicator.tsx with scroll event listener
- Detect visibility when scrollY < viewport height
- Smooth fade transition on scroll
- Add keycap press/release animation to global.css
- Integrate into HeroBanner with client:idle hydration
- Green styling matches design system colors
- Responsive positioning in lower right corner
- No performance impact from scroll listener"
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

- ✅ ScrollIndicator.tsx created at correct path
- ✅ Component renders without errors
- ✅ Scroll listener correctly detects scroll position
- ✅ Indicator visible when scrollY < viewport height
- ✅ Indicator fades out smoothly on scroll
- ✅ Keycap animation loops infinitely and smoothly
- ✅ No janky animations or performance issues
- ✅ Green colors match design system
- ✅ Responsive on mobile viewports
- ✅ Event listeners properly cleaned up (no memory leaks)
- ✅ No TypeScript or linting errors
- ✅ Changes committed to git

---

## Rollback Instructions

If you need to undo these changes:

```bash
# Undo the commit
git reset --soft HEAD~1

# Discard changes
git checkout src/components/HeroBanner.astro src/styles/global.css

# Remove the new component file
rm src/components/ScrollIndicator.tsx

# Verify clean state
git status
```

---

## Notes for Implementation

1. **Scroll Performance:** The scroll listener uses a 10ms timeout to throttle updates and avoid excessive state changes. This prevents performance issues on high-frequency scroll events.

2. **Hydration:** `client:idle` means the React component only loads after the page is idle (not during critical rendering), keeping initial load fast.

3. **Cleanup:** The useEffect return function properly removes the event listener and clears any pending timeouts to prevent memory leaks.

4. **Fade Transition:** Using `transition-opacity duration-300` provides smooth fade in/out when visibility changes, avoiding jarring appearance/disappearance.

5. **Arrow Symbol:** Unicode arrow `↓` (U+2193) is used instead of an SVG or image for simplicity and consistency with the retro aesthetic.

6. **Keycap Styling:** Border-2 and primary color match the design system. The square shape (w-14 h-14) with centered content creates the keycap appearance without requiring complex CSS or SVG.

7. **Animation Timing:** 1.3s duration creates a natural bounce effect that's visible but not distracting. The ease-in-out easing makes the press/release feel smooth and physical.

8. **Mobile Responsive:** Using Tailwind's `fixed bottom-8 right-8` ensures the indicator stays 32px from edges on all viewport sizes without requiring media queries.

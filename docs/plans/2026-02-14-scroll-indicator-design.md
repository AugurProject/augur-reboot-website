# Scroll Indicator Design

**Date:** 2026-02-14
**Feature:** Add animated keyboard keycap scroll indicator
**Status:** Design approved, ready for implementation

---

## Overview

Add a retro-styled animated scroll indicator in the lower right corner of the homepage that invites users to scroll further. The indicator displays an arrow-down keycap that animates between pressed and released states, appearing only when the user is viewing the hero section or at the top of the page.

---

## User Intent

Provide visual feedback that encourages exploration of content below the hero banner, guiding users to discover the blog preview and other sections without explicit calls-to-action.

---

## Design Decisions

### 1. Component Architecture

**Decision:** Create `ScrollIndicator.tsx` as a React component with scroll event listeners.

**Why:**
- Consistent with other interactive components on the site
- Easy state management for visibility toggling
- Smooth animation handling
- Good browser support

### 2. Placement & Visibility

**Decision:** Fixed position in lower right corner, visible only when scrollY < viewport height.

**Why:**
- Doesn't interfere with hero banner content
- Natural "next step" position for user eye flow
- Automatically hides as user explores other sections
- Smooth fade transition for non-jarring UX

### 3. Visual Style

**Decision:** Retro keyboard keycap aesthetic using CSS border/box styling, green colors from design system, no glow effects.

**Why:**
- Matches site's retro aesthetic
- Consistency with color scheme (primary green #2AE7A8)
- Simple geometric design is unmissable but not distracting
- Avoids fx-glow effect which would be too eye-catching for a subtle cue

### 4. Animation

**Decision:** CSS keyframe animation simulating physical keyboard key press/release cycle.

**Why:**
- GPU-accelerated, smooth 60fps performance
- No JavaScript overhead
- Intuitive visual metaphor of pressing a key
- Infinite loop with appropriate timing

---

## Technical Approach

### Component Structure

**File:** `src/components/ScrollIndicator.tsx`

**Responsibilities:**
- Render keycap UI with arrow symbol
- Listen to window scroll events
- Calculate visibility based on scroll position
- Apply/remove visibility class based on scroll state
- Cleanup event listeners on unmount

### Scroll Calculation

```
showIndicator = scrollY < window.innerHeight
```

Smooth fade transition using opacity animation as user scrolls.

### Keycap Design

```
┌─────────┐
│    ↓    │
└─────────┘
```

- Border: 2px solid green (--color-primary or --color-loud-foreground)
- Background: transparent or very dark
- Arrow symbol: ↓ (Unicode down arrow)
- Size: ~50px × 50px keycap with centered content
- Depth effect: subtle box-shadow or transform translateY for 3D feel

### Animation Timing

```
0%:    keycap at normal position (translateY: 0)
50%:   keycap pressed down (translateY: 8-12px)
100%:  return to normal position
```

Duration: 1.2-1.5 seconds for natural bounce feel
Repeat: infinite

---

## Integration

**File:** `src/components/HeroBanner.astro`

Add after the main hero content:
```astro
<ScrollIndicator client:idle />
```

Position using Tailwind `fixed bottom-8 right-8` or similar.

---

## Styling Details

### Colors

- Border: Use `--color-primary` (#2AE7A8) or `--color-loud-foreground` (green-400)
- Text/arrow: Same green as border
- Background: `transparent` or very subtle `rgba(foreground, 0.05)`

### Spacing

- Bottom: 32px from viewport bottom (Tailwind `bottom-8`)
- Right: 32px from viewport right (Tailwind `right-8`)
- Padding inside keycap: 12-16px

### Typography

- Font: Monospace or sans-serif (system font OK)
- Size: Large enough to be visible from distance (16-24px arrow symbol)
- Weight: Normal

### Visibility Transition

- Fade in/out: 300ms opacity transition
- When scrollY > window.innerHeight: opacity-0
- When scrollY < window.innerHeight: opacity-100

---

## Testing Checklist

- [ ] Component renders without errors
- [ ] Scroll listener correctly detects scroll position
- [ ] Indicator visible when scrollY < viewport height
- [ ] Indicator fades out smoothly on scroll
- [ ] Keycap animation loops infinitely and smoothly
- [ ] No janky animations or performance issues
- [ ] Responsive on mobile (appears in correct position)
- [ ] Cleanup: event listeners removed on unmount
- [ ] No memory leaks from scroll listener

---

## Success Criteria

✅ Scroll indicator appears in lower right corner
✅ Only visible when at top of page/hero section
✅ Animated keycap looks retro and matches design
✅ Green colors match existing design system
✅ Animation is smooth and non-distracting
✅ Fades out naturally on scroll
✅ Works on all viewport sizes
✅ No performance impact

---

## Future Enhancements

Without architectural changes:
- Add subtle color pulse/breathing effect
- Animate between different arrow directions based on viewport section
- Change animation speed based on scroll proximity
- Add keyboard shortcut hint (Space to scroll, etc.)

---

## Notes for Implementation

1. **Scroll Performance:** Use `throttle` or `requestAnimationFrame` for scroll listener to avoid performance issues
2. **Hydration:** Use `client:idle` to load ScrollIndicator only after critical content
3. **Cleanup:** Important to remove scroll listener in useEffect cleanup to prevent memory leaks
4. **Fade Transition:** Use CSS class toggle with `transition-opacity` for smooth fade
5. **Mobile:** Ensure padding/size works on small screens without blocking content

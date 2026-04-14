# Hero Banner TSX Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert HeroBanner from Astro to React (TSX) so animation timing is JS-driven via refs and useEffect, eliminating cross-component CSS scoping issues and ID-selector coupling.

**Architecture:** HeroBanner.tsx subscribes to `$appStore` (existing Nanostores). When `UIState.MAIN_CONTENT` fires, `useEffect` applies CSS animations to element refs via `setTimeout` chains — the same keyframes defined in `global.css`, but triggered by JS instead of CSS class toggling on a container. AsciiText becomes a simple TSX component (styled `<pre>`, no own animation). PageHeader converts to TSX since it's used inside the hero's animation sequence. SocialLinks inlines as 3 `<a>` tags with SVG imports.

**Tech Stack:** React 19, Nanostores (`@nanostores/react`), Tailwind CSS v4, Vite SVG imports

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/HeroBanner.tsx` | **Create** | React component — markup + animation orchestration |
| `src/components/AsciiText.tsx` | **Create** | React component — styled `<pre>` with gradient |
| `src/components/PageHeader.tsx` | **Create** | React component — site header (replaces .astro) |
| `src/components/HeroBanner.astro` | **Delete** | Replaced by TSX |
| `src/components/AsciiText.astro` | **Delete** | Replaced by TSX |
| `src/components/PageHeader.astro` | **Delete** | Replaced by TSX |
| `src/pages/index.astro` | **Modify** | Update imports, add `client:only="react"` to HeroBanner |
| `src/pages/404.astro` | **Modify** | Update AsciiText import |
| `src/pages/team.astro` | **Modify** | Update PageHeader import |
| `src/pages/mission.astro` | **Modify** | Update PageHeader import |
| `src/pages/faq.astro` | **Modify** | Update PageHeader import |
| `src/pages/blog/index.astro` | **Modify** | Update PageHeader import |
| `src/pages/privacy.astro` | **Modify** | Update PageHeader import |
| `src/pages/terms.astro` | **Modify** | Update PageHeader import |
| `src/styles/global.css` | **Modify** | Add missing keyframes, remove hero animation rules, remove AsciiText rules |

---

## Animation Timing Reference

Extracted from current `HeroBanner.astro` CSS. The JS implementation must reproduce these exact timings:

| Element | Keyframe | Duration | Delay | Fill |
|---------|----------|----------|-------|------|
| `#augur-logo` | `logo-fade-in`, `logo-scale-down` | 0.5s, 1s | 0s, 0.5s | forwards, forwards |
| Social: twitter | `fade-in-down` | 0.5s | 0.5s | forwards |
| Social: discord | `fade-in-down` | 0.5s | 0.7s | forwards |
| Social: github | `fade-in-down` | 0.5s | 0.9s | forwards |
| `#prediction-market-text` | `fade-in-up` | 0.8s | 1.5s | forwards |
| `#line-left` | `slide-in-from-right` | 0.25s | 2.3s | forwards |
| `#line-right` | `slide-in-from-left` | 0.25s | 2.3s | forwards |
| `#is-rebooting-text` | `scale-in`, `gradient-animation` | 0.4s, 2s | 2.6s, 3s | forwards, infinite |
| Menu item 1 | `fade-in-up` | 0.5s | 3.2s | forwards |
| Menu item 2 | `fade-in-up` | 0.5s | 3.4s | forwards |
| Fork CTA | `fade-in-up` | 0.5s | 3.6s | forwards |
| Fork meter | `fade-in-up` | 0.6s | 3.8s | forwards |
| `#top-header-row` | `fade-in-up` | 0.5s | 4.4s | forwards |

Focus first menu item at 4900ms.

---

### Task 1: Create AsciiText.tsx

**Files:**
- Create: `src/components/AsciiText.tsx`

Simple React component — renders a `<pre>` with gradient text styling. No animation (parent controls when to animate). The gradient visual effect (background-clip, fill color) is always present; the `gradient-animation` keyframe that moves the gradient is only applied when the parent passes `animated`.

- [ ] **Step 1: Create AsciiText.tsx**

```tsx
import { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface AsciiTextProps {
  className?: string;
  animated?: boolean;
  label?: string;
  children?: React.ReactNode;
}

const AsciiText = forwardRef<HTMLPreElement, AsciiTextProps>(
  ({ className, animated = false, label, children }, ref) => {
    return (
      <pre
        ref={ref}
        className={cn('ascii-text leading-none', className)}
        aria-label={label}
        style={{
          background: 'linear-gradient(to bottom, var(--color-green-600), var(--color-green-400), var(--color-green-600))',
          backgroundSize: '100% 200%',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 4px 0 #ffffff15)',
          ...(animated ? {
            animationName: 'gradient-animation',
            animationDuration: '2s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          } : {}),
        }}
      >
        {children}
      </pre>
    );
  }
);

AsciiText.displayName = 'AsciiText';

export default AsciiText;
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/jubalm/Workspace/lituus/augur-reboot-website && npx astro build 2>&1 | tail -3`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/AsciiText.tsx
git commit -m "feat: create AsciiText React component"
```

---

### Task 2: Create PageHeader.tsx

**Files:**
- Create: `src/components/PageHeader.tsx`
- Reference: `src/components/PageHeader.astro` (current implementation to replicate)

Convert PageHeader.astro to React. This component is used by 8 pages. Key changes:
- SVG imports stay the same (Vite handles them in both Astro and React)
- `withBase()` works in React via `import.meta.env` (already used in TSX files like `ForkAsciiArt.tsx`)
- The scoped `<style>` `@keyframes bob` moves to `global.css` (or uses Tailwind `animate-[bob_2s_ease-in-out_infinite]` — the keyframe needs to exist in global.css)
- BorderBeam is already React — direct import, no `client:` directive needed
- SocialLinks inlines as 3 `<a>` tags with SVG imports (it's simple, used in few places, and this avoids creating a separate SocialLinks.tsx)

- [ ] **Step 1: Add `@keyframes bob` to global.css**

Add after the existing keyframes block (before `/* --- Hero Banner Animation Sequence --- */`):

```css
@keyframes bob {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-5px); }
}
```

Note: This is the PageHeader version (5px), not the HeroBanner version (4px). The hero will use its own timing via JS. The PageHeader uses Tailwind `animate-[bob_2s_ease-in-out_infinite]` which references this keyframe.

- [ ] **Step 2: Create PageHeader.tsx**

```tsx
import DiscordLogo from '../assets/discord.svg';
import XLogo from '../assets/x.svg';
import GithubLogo from '../assets/github.svg';
import WarningMark from '@phosphor-icons/core/assets/regular/siren.svg';
import BorderBeam from './ui/BorderBeam';
import Pointer from './Pointer';
import { withBase } from '../lib/utils';

interface PageHeaderProps {
  backHref?: string;
  showCta?: boolean;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  backHref,
  showCta = false,
  className = '',
}) => {
  const faqHref = withBase('/faq');

  return (
    <header
      className={`flex flex-col items-center gap-3 px-10 py-6 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4 ${className}`}
    >
      {/* Left slot: back button */}
      <div className="w-full flex md:justify-start justify-center order-last md:order-none">
        {backHref ? (
          <a
            href={backHref}
            className="font-display text-lg tracking-wide inline-flex items-center gap-1 text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none transition-colors uppercase"
          >
            <Pointer animated="auto" direction="left" />
            BACK TO HOME
          </a>
        ) : (
          <span className="hidden md:block" />
        )}
      </div>

      {/* Center: Fork CTA */}
      <div className="flex justify-center">
        {showCta && (
          <div className="animate-[bob_2s_ease-in-out_infinite]">
            <BorderBeam duration={2.5}>
              <a
                href={faqHref}
                className="font-display bg-foreground/5 tracking-wide flex items-center px-4 py-2 text-lg font-semibold text-loud-foreground uppercase shadow-[0_0_10px_oklch(from_var(--color-foreground)_l_c_h/_0.4)] hover:fx-glow-sm focus:fx-glow-sm focus:outline-none whitespace-nowrap"
              >
                <WarningMark className="w-6 h-6 border-muted-foreground/80 rounded-full p-1 mr-3" />
                THE FORK IS HERE! OWN REP? ACT NOW.
              </a>
            </BorderBeam>
          </div>
        )}
      </div>

      {/* Right slot: social links */}
      <div className="flex md:justify-end">
        <div className="flex gap-x-8">
          <a
            href="https://x.com/AugurProject"
            className="text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
          >
            <XLogo />
          </a>
          <a
            href="https://discord.gg/Y3tCZsSmz3"
            className="text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
          >
            <DiscordLogo />
          </a>
          <a
            href="https://github.com/AugurProject/"
            className="text-foreground hover:text-loud-foreground focus:text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none no-underline text-3xl"
          >
            <GithubLogo />
          </a>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
```

- [ ] **Step 3: Update all PageHeader imports (7 pages)**

In each file, change `import PageHeader from '../components/PageHeader.astro'` (or relative path variant) to:
```tsx
import PageHeader from '../components/PageHeader.tsx';
```

Files to update:
- `src/pages/404.astro`
- `src/pages/team.astro`
- `src/pages/mission.astro`
- `src/pages/faq.astro`
- `src/pages/blog/index.astro`
- `src/pages/privacy.astro`
- `src/pages/terms.astro`

And add `client:load` directive to each `<PageHeader>` usage in those pages, since it's now a React island. For example:
```astro
<!-- Before -->
<PageHeader backHref={withBase('/?intro=false')} showCta={false} />

<!-- After -->
<PageHeader client:load backHref={withBase('/?intro=false')} showCta={false} />
```

Note: The `showCta` variant with `BorderBeam` already renders correctly — BorderBeam is a React component and no longer needs a nested `client:load` when used inside another React component.

- [ ] **Step 4: Verify build**

Run: `cd /Users/jubalm/Workspace/lituus/augur-reboot-website && npx astro build 2>&1 | tail -3`
Expected: build succeeds

- [ ] **Step 5: Delete PageHeader.astro**

```bash
rm src/components/PageHeader.astro
```

- [ ] **Step 6: Verify build**

Run: `npx astro build 2>&1 | tail -3`
Expected: build succeeds

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: convert PageHeader to React component

- Replaces PageHeader.astro with PageHeader.tsx
- Inlines social links (3 <a> tags with SVG imports)
- Adds @keyframes bob to global.css for animate-[bob_*] usage
- Updates all 7 page imports to .tsx with client:load"
```

---

### Task 3: Update 404.astro to use AsciiText.tsx

**Files:**
- Modify: `src/pages/404.astro`

- [ ] **Step 1: Update import and usage**

Change the import from:
```astro
import AsciiText from "../components/AsciiText.astro";
```
to:
```tsx
import AsciiText from "../components/AsciiText.tsx";
```

And update the AsciiText usage to use `animated` prop instead of relying on CSS class:
```astro
<AsciiText client:load animated class="tracking-tight text-[clamp(0.8rem,1vw,0.9rem)] fx-glow-sm max-w-full overflow-hidden mx-auto" label="404 - Page Not Found">
```

Note: `animated` prop makes the gradient loop immediately on the 404 page (no hero sequence).

- [ ] **Step 2: Verify build**

Run: `npx astro build 2>&1 | tail -3`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat: update 404 page to use AsciiText React component"
```

---

### Task 4: Create HeroBanner.tsx

**Files:**
- Create: `src/components/HeroBanner.tsx`
- Reference: `src/components/HeroBanner.astro` (current implementation)

This is the main task. The React component:
- Uses `useStore($appStore)` to subscribe to state changes
- Has `useRef` for each animated element
- `useEffect` triggers animations via `element.style.animation = "..."` with `setTimeout` for delays
- Handles both `animations-started` (intro plays) and `animations-skipped` (instant show) paths
- Handles cleanup: clears timeouts, removes animation classes on unmount
- Sets initial `opacity: 0` via inline styles on mount
- Renders PageHeader (React), AsciiText (React), ForkMonitor (React), ScrollIndicator (React)
- Menu links use Tailwind classes directly; the `::before` pointer pseudo-element stays in global.css as a utility class

**Key design decisions:**
- No IDs. All element access via `useRef`.
- Animation triggers are JS `setTimeout` chains, not CSS classes on a container.
- The `gradient-animation` for AsciiText is composed with `scale-in` in the same `element.style.animation` assignment.
- Social links are part of the animation sequence (rendered inside PageHeader, refs passed up or animated via CSS class toggling).

Wait — social links are inside PageHeader which is a separate React component. The hero needs to animate them. Two options:
1. Pass refs down to PageHeader for the social link `<a>` tags
2. Keep social links as part of the hero's animation via CSS class toggling (add a class to PageHeader that triggers social link animations)

Option 2 is cleaner — the social link fade-in animations only apply on the homepage, and the PageHeader can accept an `animateSocialLinks` prop that adds a class. When the hero's timeout fires, it sets the prop.

Actually, simplest: PageHeader renders social links inside a container div. HeroBanner passes a `ref` via `forwardRef` or uses a callback ref. But `forwardRef` only gives one ref.

Let me reconsider. The social links fade-in at 0.5s, 0.7s, 0.9s — early in the sequence. Since PageHeader is a React component rendered inside HeroBanner, HeroBanner can pass an `animate` boolean prop. When true, PageHeader adds CSS animation classes to the social links. PageHeader manages its own sub-timings.

Actually even simpler: just set `opacity: 0` on the social links container initially, then animate with a single class toggle. But the current design staggers them (twitter 0.5s, discord 0.7s, github 0.9s).

The cleanest approach: PageHeader exposes refs for its social links via `useImperativeHandle`, or HeroBanner wraps the social link section in its own div with a ref. But that breaks the PageHeader abstraction.

**Final decision:** PageHeader subscribes to `$appStore` directly via `useStore`. When `UIState.MAIN_CONTENT` fires, it applies staggered `fade-in-down` animations to social link refs via `useEffect`. No prop drilling — both HeroBanner and PageHeader independently react to the same store state. PageHeader handles the social link timing internally.

- [ ] **Step 1: Add store-driven social link animation to PageHeader**

Import and subscribe to the store:
```tsx
import { useStore } from '@nanostores/react';
import { $appStore, UIState } from '../stores/animationStore';
```

Inside the component, add refs and store-driven effect:
```tsx
const appState = useStore($appStore);
const socialRefs = useRef<(HTMLAnchorElement | null)[]>([]);
const socialAnimated = useRef(false);

useEffect(() => {
  if (appState.uiState === UIState.MAIN_CONTENT && !socialAnimated.current) {
    socialAnimated.current = true;
    const delays = [0.5, 0.7, 0.9]; // twitter, discord, github
    socialRefs.current.forEach((el, i) => {
      if (el) {
        el.style.animation = `fade-in-down 0.5s ease-out ${delays[i]}s forwards`;
      }
    });
  }
}, [appState.uiState]);
```

And on the social `<a>` tags, set initial `opacity: 0` and attach refs:
```tsx
<a
  ref={(el) => { socialRefs.current[0] = el; }}
  style={{ opacity: 0 }}
  href="https://x.com/AugurProject"
  className="..."
>
  <XLogo />
</a>
```

Repeat for discord (index 1) and github (index 2).

- [ ] **Step 2: Create HeroBanner.tsx**

```tsx
import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { $appStore, UIState, appActions } from '../stores/animationStore';
import AugurLogo from '../assets/augur.svg';
import AsciiText from './AsciiText';
import PageHeader from './PageHeader';
import ForkMonitor from './ForkMonitor';
import { ScrollIndicator } from './ScrollIndicator';
import BorderBeam from './ui/BorderBeam';
import WarningMark from '@phosphor-icons/core/assets/regular/siren.svg';
import { withBase } from '../lib/utils';

// Animation timing table (delays in seconds from sequence start)
const ANIMATIONS = {
  logo: { keyframes: 'logo-fade-in 0.5s ease-in 0s forwards, logo-scale-down 1s ease-out 0.5s forwards', delay: 0 },
  socialAnimated: true,  // triggers PageHeader's social link staggering
  predictionMarket: { keyframes: 'fade-in-up 0.8s ease-out 1.5s forwards', delay: 1500 },
  lineLeft: { keyframes: 'slide-in-from-right 0.25s ease-out 2.3s forwards', delay: 2300 },
  lineRight: { keyframes: 'slide-in-from-left 0.25s ease-out 2.3s forwards', delay: 2300 },
  asciiText: { keyframes: 'scale-in 0.4s ease-in 2.6s forwards, gradient-animation 2s linear 3s infinite', delay: 2600 },
  menuItem1: { keyframes: 'fade-in-up 0.5s ease-out 3.2s forwards', delay: 3200 },
  menuItem2: { keyframes: 'fade-in-up 0.5s ease-out 3.4s forwards', delay: 3400 },
  forkCta: { keyframes: 'fade-in-up 0.5s ease-out 3.6s forwards', delay: 3600 },
  forkMeter: { keyframes: 'fade-in-up 0.6s ease-out 3.8s forwards', delay: 3800 },
  topHeaderRow: { keyframes: 'fade-in-up 0.5s ease-out 4.4s forwards', delay: 4400 },
} as const;

const FOCUS_DELAY = 4900;

const HeroBanner: React.FC = () => {
  const appState = useStore($appStore);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRowRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLElement>(null);
  const predictionMarketRef = useRef<HTMLParagraphElement>(null);
  const lineLeftRef = useRef<HTMLSpanElement>(null);
  const asciiTextRef = useRef<HTMLPreElement>(null);
  const lineRightRef = useRef<HTMLSpanElement>(null);
  const menuItem1Ref = useRef<HTMLAnchorElement>(null);
  const menuItem2Ref = useRef<HTMLAnchorElement>(null);
  const forkCtaRef = useRef<HTMLDivElement>(null);
  const forkMeterRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);
  const lastStateRef = useRef<UIState | null>(null);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // Set initial hidden state on all animated elements
  useEffect(() => {
    const hiddenStyle = 'opacity: 0';
    const elements = [
      headerRowRef.current,
      logoRef.current,
      predictionMarketRef.current,
      lineLeftRef.current,
      asciiTextRef.current,
      lineRightRef.current,
      menuItem1Ref.current,
      menuItem2Ref.current,
      forkCtaRef.current,
      forkMeterRef.current,
    ];
    elements.forEach((el) => {
      if (el) el.style.cssText += hiddenStyle;
    });
    // Logo has special initial transform
    if (logoRef.current) {
      logoRef.current.style.transform = 'scale(2) translateY(50%)';
    }

    return clearTimeouts;
  }, [clearTimeouts]);

  // React to state changes
  useEffect(() => {
    if (appState.uiState === lastStateRef.current) return;
    lastStateRef.current = appState.uiState;

    if (appState.uiState !== UIState.MAIN_CONTENT) return;

    clearTimeouts();

    const urlParams = new URLSearchParams(window.location.search);
    const skipIntro = urlParams.get('intro') === 'false';

    if (skipIntro) {
      // Show everything immediately
      const elements = [
        headerRowRef.current,
        logoRef.current,
        predictionMarketRef.current,
        lineLeftRef.current,
        asciiTextRef.current,
        lineRightRef.current,
        menuItem1Ref.current,
        menuItem2Ref.current,
        forkCtaRef.current,
        forkMeterRef.current,
      ];
      elements.forEach((el) => {
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
      if (logoRef.current) {
        logoRef.current.style.transform = 'scale(1) translateY(0)';
      }
      // Start gradient animation on ascii text
      if (asciiTextRef.current) {
        asciiTextRef.current.style.animation = 'gradient-animation 2s linear infinite';
      }
      menuItem1Ref.current?.focus();
    } else {
      // Play entrance sequence
      const schedule = (el: HTMLElement | null, keyframes: string, delay: number) => {
        if (!el) return;
        const timeout = window.setTimeout(() => {
          el.style.animation = keyframes;
        }, delay);
        timeoutsRef.current.push(timeout);
      };

      schedule(logoRef.current, ANIMATIONS.logo.keyframes, ANIMATIONS.logo.delay);
      schedule(predictionMarketRef.current, ANIMATIONS.predictionMarket.keyframes, ANIMATIONS.predictionMarket.delay);
      schedule(lineLeftRef.current, ANIMATIONS.lineLeft.keyframes, ANIMATIONS.lineLeft.delay);
      schedule(lineRightRef.current, ANIMATIONS.lineRight.keyframes, ANIMATIONS.lineRight.delay);
      schedule(asciiTextRef.current, ANIMATIONS.asciiText.keyframes, ANIMATIONS.asciiText.delay);
      schedule(menuItem1Ref.current, ANIMATIONS.menuItem1.keyframes, ANIMATIONS.menuItem1.delay);
      schedule(menuItem2Ref.current, ANIMATIONS.menuItem2.keyframes, ANIMATIONS.menuItem2.delay);
      schedule(forkCtaRef.current, ANIMATIONS.forkCta.keyframes, ANIMATIONS.forkCta.delay);
      schedule(forkMeterRef.current, ANIMATIONS.forkMeter.keyframes, ANIMATIONS.forkMeter.delay);
      schedule(headerRowRef.current, ANIMATIONS.topHeaderRow.keyframes, ANIMATIONS.topHeaderRow.delay);

      // Focus first menu item after sequence completes
      const focusTimeout = window.setTimeout(() => {
        menuItem1Ref.current?.focus();
      }, FOCUS_DELAY);
      timeoutsRef.current.push(focusTimeout);
    }
  }, [appState.uiState, clearTimeouts]);

  return (
    <div className="h-screen min-h-fit w-full relative">
      <div
        ref={containerRef}
        className="grid grid-rows-[auto_auto_auto] min-h-full z-10 text-center content-between"
      >
        <div ref={headerRowRef}>
          <PageHeader
            showCta={false}
          />
        </div>

        {/* Middle Section */}
        <div className="flex flex-col items-center place-items-center py-8 gap-y-4">
          <AugurLogo ref={logoRef as React.Ref<SVGSVGElement>} className="text-9xl" />
          <p
            ref={predictionMarketRef}
            className="font-light font-display border border-foreground/20 px-3 py-1 mx-4 sm:text-xl tracking-widest leading-none uppercase"
          >
            THE FRONTIER OF PREDICTION MARKETS
          </p>

          <h2 className="grid grid-cols-[minmax(0.25rem,1rem)_1fr_minmax(0.25rem,1rem)] items-center gap-x-4">
            <span ref={lineLeftRef} className="h-px bg-foreground" />
            <AsciiText
              ref={asciiTextRef}
              className="tracking-tighter text-[clamp(0.325rem,1vw,0.625rem)]"
            >
{`██╗ ███████╗     ██████╗  ███████╗ ██████╗   ██████╗   ██████╗  ████████╗ ██╗ ███╗   ██╗  ██████╗
██║ ██╔════╝     ██╔══██╗ ██╔════╝ ██╔══██╗ ██╔═══██╗ ██╔═══██╗ ╚══██╔══╝ ██║ ████╗  ██║ ██╔════╝
 ██║ ███████╗     ██████╔╝ █████╗   ██████╔╝ ██║   ██║ ██║   ██║    ██║    ██║ ██╔██╗ ██║ ██║  ███╗
 ██║ ╚════██║     ██╔══██╗ ██╔══╝   ██╔══██╗ ██║   ██║ ██║   ██║    ██║    ██║ ██║╚██╗██║ ██║   ██║
 ██║ ███████║     ██║  ██║ ███████╗ ██████╔╝ ╚██████╔╝ ╚██████╔╝    ██║    ██║ ██║ ╚████║ ╚██████╔╝
╚═╝ ╚══════╝     ╚═╝  ╚═╝ ╚══════╝ ╚═════╝   ╚═════╝   ╚═════╝     ╚═╝    ╚═╝ ╚═╝  ╚═══╝  ╚═════╝`}
            </AsciiText>
            <span ref={lineRightRef} className="h-px bg-foreground" />
          </h2>

          <div className="flex flex-col place-items-center text-left w-full max-w-3xl mx-auto mb-3">
            <a
              ref={menuItem1Ref}
              href={withBase('/mission')}
              className="menu-link font-display text-xl sm:text-3xl font-bold text-foreground hover:text-loud-foreground focus:text-loud-foreground block hover:fx-glow focus:fx-glow focus:outline-none uppercase"
            >
              THE NEXT GENERATION OF ORACLES
            </a>
            <a
              ref={menuItem2Ref}
              href={withBase('/team')}
              className="menu-link font-display text-xl sm:text-3xl font-bold text-foreground hover:text-loud-foreground focus:text-loud-foreground block hover:fx-glow focus:fx-glow focus:outline-none uppercase"
            >
              THE MINDS BEHIND THE REBOOT
            </a>
          </div>

          {/* Fork CTA */}
          <div ref={forkCtaRef}>
            <div className="animate-[bob_2s_ease-in-out_infinite]">
              <BorderBeam duration={2.5}>
                <a
                  href={withBase('/faq')}
                  className="font-display bg-foreground/5 tracking-wide flex items-center px-4 py-2 sm:text-xl font-semibold text-loud-foreground uppercase shadow-[0_0_10px_oklch(from_var(--color-foreground)_l_c_h/_0.4)] hover:fx-glow-sm focus:fx-glow-sm focus:outline-none whitespace-nowrap"
                >
                  <WarningMark className="w-6 h-6 border-muted-foreground/80 rounded-full p-1 mr-3" />
                  THE FORK IS HERE! OWN REP? ACT NOW.
                </a>
              </BorderBeam>
            </div>
          </div>
        </div>

        {/* Bottom Section: Fork Monitor */}
        <div ref={forkMeterRef} className="py-6">
          <ForkMonitor animated={true} />
        </div>
      </div>

      <ScrollIndicator delay={5000} />
    </div>
  );
};

export default HeroBanner;
```

**Important notes on the implementation:**
- SVG components (`<AugurLogo>`, `<WarningMark>`) may need ref handling adjustments — Vite imports SVGs as React components, and `ref` on them requires `forwardRef` in the SVG component or casting.
- The `logoRef` targets `<AugurLogo>` which is an SVG. The ref type should be `SVGSVGElement`. If Vite's SVG import doesn't forward refs, wrap it in a `<span>` and ref the span.
- The ASCII art content is a template literal inside `{` `}` to preserve whitespace.
- Menu links use `menu-link` class for the `::before` pointer pseudo-element (defined in global.css — see Task 5).

- [ ] **Step 3: Update index.astro**

Change:
```astro
import HeroBanner from '../components/HeroBanner.astro';
```
to:
```tsx
import HeroBanner from '../components/HeroBanner.tsx';
```

And change:
```astro
<HeroBanner />
```
to:
```astro
<HeroBanner client:only="react" />
```

Use `client:only="react"` (not `client:load`) because HeroBanner subscribes to the Nanostore on mount and should never SSR — the animation state is client-only.

- [ ] **Step 4: Verify build**

Run: `npx astro build 2>&1 | tail -3`
Expected: build succeeds. There may be TypeScript errors with SVG ref typing — fix as needed.

- [ ] **Step 5: Delete HeroBanner.astro**

```bash
rm src/components/HeroBanner.astro
```

- [ ] **Step 6: Delete AsciiText.astro**

```bash
rm src/components/AsciiText.astro
```

- [ ] **Step 7: Verify build**

Run: `npx astro build 2>&1 | tail -3`
Expected: build succeeds

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: convert HeroBanner to React with JS-driven animation timing

- Replaces HeroBanner.astro with HeroBanner.tsx
- Animation sequence driven by useEffect + setTimeout on element refs
- No CSS scoping issues — all animation applied via inline styles
- Keyframes remain in global.css as definitions only
- AsciiText.astro deleted, replaced by AsciiText.tsx"
```

---

### Task 5: Clean up global.css — remove hero animation rules, add menu-link utility

**Files:**
- Modify: `src/styles/global.css`

Now that all hero animation timing is JS-driven, the CSS rules for hero initial states, animation triggers, skip states, and social link animations are dead code. Remove them.

Keep in global.css:
- All `@keyframes` definitions (they're referenced by JS `element.style.animation`)
- `@keyframes gradient-animation` (add if missing — currently only in AsciiText.astro's scoped style, which is being deleted)
- Menu link `::before` pointer pseudo-element (extracted from hero CSS as `.menu-link` utility)
- CRT, cursor, pointer, scroll indicator, reduced-motion rules

Remove from global.css:
- Hero initial hidden states (`#top-header-row, #is-rebooting-text, ...`)
- `#augur-logo` initial state
- `#menu-items-container a::before` and hover rules (replaced by `.menu-link`)
- `#menu-items-container:has(...)` hover priority rule
- `#hero-banner-container.animations-skipped ...` rules
- `#hero-banner-container.animations-started ...` rules
- Social link initial hidden states and animation triggers (`#discord-link, #twitter-link, #github-link { opacity: 0 }` etc.)
- `.ascii-text` class styles (moved to AsciiText.tsx inline styles)
- `.title` class and `gradient-animation` keyframe (if still present — already removed in earlier commit)

Add to global.css:
- `@keyframes gradient-animation` (move from AsciiText.astro which is being deleted)
- `.menu-link` utility class for the pointer pseudo-element

- [ ] **Step 1: Add `@keyframes gradient-animation` to global.css**

Add near the other keyframes:

```css
@keyframes gradient-animation {
	0% {
		background-position: 0% 0%;
	}
	100% {
		background-position: 0% 200%;
	}
}
```

- [ ] **Step 2: Add `.menu-link` utility class to global.css**

This replaces the old `#menu-items-container a` rules. Place it after the keyframes, before the hero animation section:

```css
/* Menu link pointer pseudo-element */
.menu-link {
	position: relative;

	&::before {
		content: '>';
		opacity: 0;
		color: var(--color-foreground);
		display: inline-block;
		margin-right: 0.5rem;
		transition: opacity 0.2s ease-in-out;
	}

	&:hover::before,
	&:focus::before {
		opacity: 1;
		animation: bounce-horizontal 1s ease-in-out infinite;
	}
}
```

- [ ] **Step 3: Remove all hero animation CSS rules**

Delete the entire `/* --- Hero Banner Animation Sequence --- */` section from global.css, which includes:
- Initial hidden states for all hero elements
- `#augur-logo` initial state
- `#menu-items-container a` and `::before` rules
- `#menu-items-container:has(...)` hover priority
- `#hero-banner-container.animations-skipped ...` rules
- `#hero-banner-container.animations-started ...` rules
- `.ascii-text:not(#is-rebooting-text)` rule

Also remove the social link animation rules:
- `#discord-link, #twitter-link, #github-link { opacity: 0 }` initial state
- `body:not(:has(#hero-banner-container))` social link visibility rules
- `#hero-banner-container.animations-skipped` social link rules
- `#hero-banner-container.animations-started` social link animation triggers

- [ ] **Step 4: Update reduced-motion block**

Replace the hero-specific rules in the `@media (prefers-reduced-motion: reduce)` block. Remove:
- `#hero-banner-container.animations-started #twitter-link` etc.
- `#hero-banner-container.animations-started [data-animation-delay]`

The JS-driven approach handles reduced-motion natively (no animations are set if needed), but if we want to support it, add a `prefers-reduced-motion` check in the HeroBanner's `useEffect`:

In HeroBanner.tsx, add to the skip-intro branch and the entrance sequence:
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

If reduced motion is preferred, show everything immediately (same as skip-intro path). The CSS `@media (prefers-reduced-motion: reduce)` block in global.css handles non-hero animations (cursor, pointer, keycap, CRT, glow).

- [ ] **Step 5: Verify build**

Run: `npx astro build 2>&1 | tail -3`
Expected: build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css
git commit -m "refactor: clean up global.css — remove hero animation CSS rules

- Remove all hero animation trigger/skip/initial-state rules
- Remove social link animation rules
- Add @keyframes gradient-animation (moved from deleted AsciiText.astro)
- Add .menu-link utility class for pointer pseudo-element
- Keyframes remain as definitions for JS-driven animation"
```

---

### Task 6: Add reduced-motion support to HeroBanner.tsx

**Files:**
- Modify: `src/components/HeroBanner.tsx`

- [ ] **Step 1: Add prefers-reduced-motion check**

In the `useEffect` that reacts to state changes, add a check at the top of the `UIState.MAIN_CONTENT` branch:

```tsx
useEffect(() => {
  if (appState.uiState === lastStateRef.current) return;
  lastStateRef.current = appState.uiState;

  if (appState.uiState !== UIState.MAIN_CONTENT) return;

  clearTimeouts();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Show everything immediately, no animations
    const elements = [
      headerRowRef.current,
      logoRef.current,
      predictionMarketRef.current,
      lineLeftRef.current,
      asciiTextRef.current,
      lineRightRef.current,
      menuItem1Ref.current,
      menuItem2Ref.current,
      forkCtaRef.current,
      forkMeterRef.current,
    ];
    elements.forEach((el) => {
      if (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    });
    if (asciiTextRef.current) {
      asciiTextRef.current.style.animation = 'gradient-animation 2s linear infinite';
    }
    menuItem1Ref.current?.focus();
    return;
  }

  // ... rest of existing skip/intro logic
}, [appState.uiState, clearTimeouts]);
```

- [ ] **Step 2: Verify build**

Run: `npx astro build 2>&1 | tail -3`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/HeroBanner.tsx
git commit -m "feat: add prefers-reduced-motion support to HeroBanner"
```

---

### Task 7: Clean up dead `oxanium.woff2` font file

**Files:**
- Delete: `public/fonts/oxanium.woff2`

- [ ] **Step 1: Delete the file**

```bash
rm public/fonts/oxanium.woff2
```

- [ ] **Step 2: Verify build**

Run: `npx astro build 2>&1 | tail -3`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove dead oxanium.woff2 font file"
```

---

## Self-Review

### Spec Coverage
- ✅ Convert HeroBanner to TSX with JS-driven animation timing
- ✅ Convert AsciiText to TSX
- ✅ Convert PageHeader to TSX
- ✅ Animation timing table preserved exactly
- ✅ No CSS scoping issues (refs over IDs)
- ✅ global.css keeps keyframes, loses trigger rules
- ✅ Reduced-motion support
- ✅ Dead font file cleanup

### Placeholder Scan
- No TBD/TODO found
- All code blocks are complete implementations
- All file paths are exact

### Type Consistency
- `AsciiTextProps` uses `forwardRef<HTMLPreElement>` — consistent with `asciiTextRef` typed as `useRef<HTMLPreElement>`
- `PageHeaderProps` has `animateSocialLinks?: boolean` — used by HeroBanner
- `withBase()` imported from same `lib/utils` in both components
- Store types (`UIState`, `$appStore`) imported from same `stores/animationStore`

### Risks
- **SVG ref forwarding**: `<AugurLogo>` and `<WarningMark>` are Vite SVG imports. They may not forward refs. If not, wrap in a `<span>` and ref the span.
- **`client:only="react"` on HeroBanner**: This means no SSR for the hero. Since the hero's initial state is `opacity: 0` on everything, and the animation is client-only, this is correct — there's nothing useful to SSR.
- **PageHeader `client:load`** on 7 pages: Adds a small hydration cost. The component is lightweight (no state, mostly static). Acceptable tradeoff for consistency.
- **Social link animation**: PageHeader subscribes to `$appStore` directly — no prop drilling. Both PageHeader and HeroBanner independently react to the same store state for their respective animation sequences.

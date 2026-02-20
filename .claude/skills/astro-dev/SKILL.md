---
name: astro-dev
description: Astro 5.10+ development with React 19, Tailwind v4, and GitHub Pages static deployment
---

# Astro Development Skill

## ⚠️ PROJECT OVERRIDES

This project uses **GitHub Pages static deployment** with the following non-standard patterns. These override any generic Astro guidance:

- **Deployment**: GitHub Pages (`output: 'static'` in astro.config.mjs) — NOT Cloudflare Workers/SSR
- **State Management**: Nanostores + React Context ONLY — never use `useState` for global state
- **WebGL Lifecycle**: Implement `dispose()` + `isDisposed` guard in `useEffect` cleanup; never render after disposal
- **Visualizations**: SVG preferred (resolution-independent, GPU-accelerated animations) over Canvas
- **TypeScript Runtimes**: Dual tsconfig — `tsconfig.app.json` (frontend React), `tsconfig.scripts.json` (Node.js scripts)
- **Styling**: Tailwind v4 CSS-first via `@theme`/`@utility` directives in `src/styles/global.css` only

## Overview

Comprehensive guide for building modern web applications with Astro 5.10+, React 19, and Tailwind CSS v4. This documentation is tailored for static GitHub Pages deployment with interactive React islands.

## What This Skill Provides

### Automation Scripts
- **Project initialization** - Bootstrap new Astro projects with best practices
- **Content collections setup** - Generate type-safe content schemas
- **View Transitions integration** - Add smooth page transitions automatically

### Reference Documentation
- **GitHub Pages Static Deployment** - Pre-built static output, no SSR
- **React integration** - Interactive islands and hydration strategies
- **Tailwind CSS v4** - CSS-first configuration without config files
- **Nanostores** - Global state management (required pattern, NOT useState)
- **WebGL Components** - Lifecycle management with dispose() pattern
- **SVG Visualizations** - Resolution-independent, GPU-accelerated animations
- **Content Collections** - Type-safe content management (blog, learn sections)
- **View Transitions** - Smooth page animations
- **GitHub Actions** - CI/CD automation

### Component Templates
- **BaseLayout** - Full page layout with header, footer, and View Transitions
- **Card** - Reusable card component with Tailwind styling
- **Button** - React button with variants and sizes

## Quick Start

### This Project: Static GitHub Pages Deployment

This project uses pre-built static output for GitHub Pages. No SSR, no Workers bindings. Configuration is in `astro.config.mjs` with `output: 'static'`.

The project structure includes:
- React islands for interactive components (e.g., ForkGauge with WebGL)
- Nanostores for global state (fork risk data, demo mode)
- React Context for provider wrappers
- MDX blog content with RSS feed
- SVG-based visualizations (preferred over Canvas)

### Add Content Collections

```bash
python scripts/setup_content_collection.py blog
```

Creates:
- `src/content/blog/` directory
- Type-safe Zod schema in `src/content/config.ts`
- Example blog post

**Collection types:**
- `blog` - Blog posts with frontmatter
- `docs` - Documentation pages
- `products` - Product data (JSON)

### Add View Transitions

```bash
python scripts/add_view_transitions.py
```

Automatically adds View Transitions API to all layouts in `src/layouts/`.

## Common Workflows

### 1. Add Global State with Nanostores

**Always use Nanostores, NOT useState, for global state:**

```typescript
// src/stores/forkRiskStore.ts
import { atom } from 'nanostores';

export const forkRiskStore = atom<ForkRiskData>({
  level: 'None',
  percentage: 0,
  // ... state
});

// Use in React component with proper hydration:
import { useAtom } from 'nanostores';

export function ForkGauge() {
  const [forkRisk] = useAtom(forkRiskStore);
  // Component stays purely reactive
}
```

### 2. Build WebGL/Canvas Components

**Implement dispose() + isDisposed guard pattern:**

```typescript
export function MyWebGLComponent() {
  const webglRef = useRef<THREE.Renderer | null>(null);
  const isDisposed = useRef(false);

  useEffect(() => {
    const renderer = new THREE.WebGLRenderer();
    webglRef.current = renderer;

    return () => {
      if (webglRef.current && !isDisposed.current) {
        webglRef.current.dispose();
        isDisposed.current = true;
      }
    };
  }, []);

  if (isDisposed.current) return null;
  return <div ref={webglRef} />;
}
```

### 3. Create SVG Visualizations

SVG is preferred for resolution-independent, GPU-accelerated animations:

```astro
---
// Use SVG for any chart, gauge, or diagram
import ForkGauge from '../components/ForkGauge.astro';
---
<ForkGauge riskLevel="High" />
```

### 4. Use Blog Content Collections

Blog posts are in `src/content/blog/` with MDX frontmatter. RSS feed auto-generated.

See `docs/blog.md` for:
- Frontmatter schema
- MDX syntax
- Learn section structure

### 5. Manage Dual TypeScript Runtimes

```json
// tsconfig.app.json - React frontend
{
  "extends": "@tsconfig/strictest",
  "include": ["src"],
  "compilerOptions": { "lib": ["ES2020", "DOM"] }
}

// tsconfig.scripts.json - Node.js scripts
{
  "extends": "@tsconfig/strictest",
  "include": ["scripts"],
  "compilerOptions": { "lib": ["ES2020"] }
}
```

## Deployment

### GitHub Pages (Static)

The project builds static HTML/CSS/JS and deploys to GitHub Pages:

```bash
# Build creates dist/ with pre-rendered pages
npm run build

# GitHub Actions workflows handle deployment to gh-pages branch
# .github/workflows/deploy.yml orchestrates build and push
```

**Key points:**
- `astro.config.mjs` uses `output: 'static'`
- No SSR, no server-side bindings
- Pre-rendered at build time
- GitHub Actions triggers on commits to main
- Sitemap auto-generated in build

### GitHub Actions CI/CD

See `references/github-actions.md` for:
- Build and deployment workflows
- Pre-commit checks (typecheck, lint)
- Pre-merge checks (build verification)
- Automated deployment to gh-pages branch

## Key Concepts

### Static Rendering (This Project)

```javascript
// astro.config.mjs - This project uses static output
export default defineConfig({
  output: 'static',  // Pre-render all pages at build time
});
```

All pages are pre-rendered to HTML/CSS/JS at build time. No server-side rendering. Interactive React islands are hydrated as needed.

### Nanostores for Global State

Never use React's `useState` for global state. Always use Nanostores:

```typescript
// src/stores/myStore.ts
import { atom } from 'nanostores';

export const myGlobalState = atom({
  value: 'initial',
});

// In any React component:
import { useAtom } from 'nanostores';

export function MyComponent() {
  const [state, setState] = useAtom(myGlobalState);
  return <div>{state}</div>;
}
```

**Why:** Nanostores provides reactive updates across all components without prop drilling or Context overhead.

### File Structure

```
augur-reboot-website/
├── src/
│   ├── pages/              # File-based routing
│   │   ├── index.astro
│   │   ├── blog/
│   │   │   └── [...slug].astro
│   │   └── learn/
│   │       └── [...slug].astro
│   ├── layouts/           # Page layouts
│   │   └── BaseLayout.astro
│   ├── components/        # Astro components
│   │   ├── Card.astro
│   │   ├── ForkGauge.astro
│   │   └── ...
│   ├── components/        # React interactive islands
│   │   ├── Button.tsx
│   │   ├── ForkGauge.tsx (WebGL)
│   │   └── ...
│   ├── content/           # Content collections
│   │   ├── config.ts
│   │   ├── blog/
│   │   └── learn/
│   ├── stores/            # Nanostores global state
│   │   ├── forkRiskStore.ts
│   │   └── demoModeStore.ts
│   ├── styles/            # Global CSS (ONLY EDIT THIS)
│   │   └── global.css
│   └── env.d.ts           # TypeScript types
├── public/                # Static assets
├── astro.config.mjs       # Astro configuration (output: 'static')
├── package.json
├── tsconfig.app.json      # Frontend React config
├── tsconfig.scripts.json  # Node.js scripts config
└── .github/workflows/     # GitHub Actions CI/CD
    └── deploy.yml
```

### Hydration & React Islands

Control when React components hydrate:

```astro
---
// In .astro files
import Counter from '../components/Counter.tsx';
---

<!-- Hydrate immediately (required for animations) -->
<Counter client:load />

<!-- Hydrate when idle -->
<Comments client:idle />

<!-- Hydrate when visible -->
<RelatedPosts client:visible />

<!-- Hydrate on media query (mobile nav) -->
<MobileMenu client:media="(max-width: 768px)" />

<!-- Client-only (no SSR) -->
<BrowserOnlyWidget client:only="react" />
```

**Pro tip:** Always add hydration directives or React components won't be interactive!

## Best Practices

### Performance
1. **Pre-render all content** - Astro handles SSG, no servers to manage
2. **Optimize images** - Use Astro's `<Image />` component
3. **Minimize client JS** - Use React islands only where needed (ForkGauge, demo controls)
4. **Use SVG for visualizations** - Preferred over Canvas (resolution-independent, GPU-accelerated)
5. **Lazy-load interactive components** - Use `client:visible` for below-the-fold React islands

### Development
1. **Type everything** - Use TypeScript for frontend (tsconfig.app.json) and scripts (tsconfig.scripts.json)
2. **Use Nanostores, not useState** - Global state must use Nanostores + useAtom
3. **Validate content** - Use Zod schemas in `src/content/config.ts`
4. **Test locally** - Run `npm run dev` and verify on `localhost:4321`
5. **Follow conventions** - File-based routing in `src/pages/`, content collections in `src/content/`

### WebGL/GPU Safety
1. **Always implement dispose()** - Essential for Three.js, Babylon.js, Canvas contexts
2. **Use isDisposed flag** - Guard against rendering after disposal
3. **Clean up in useEffect** - Call dispose() in cleanup function
4. **Never render after dispose** - Return null if isDisposed is true

### Deployment
1. **GitHub Actions handles everything** - No manual deployment
2. **Pre-merge checks required** - typecheck, lint, build must pass
3. **Automated to gh-pages branch** - GitHub Actions pushes `dist/` to gh-pages
4. **Verify sitemap** - GitHub Actions confirms sitemap.xml generation
5. **Monitor build logs** - Check Actions tab if deployment fails

## Troubleshooting

### Common Issues

**Build Errors:**
- Run `npm run build` to test production build
- Run `npx astro check` for TypeScript errors
- Check Node.js version (18+)
- Clear `.astro/` cache: `rm -rf .astro/` and rebuild

**React Component Not Interactive:**
- Ensure component has `client:load` (or `client:idle`/`client:visible`)
- Check browser console for hydration warnings
- Verify component uses `client:only="react"` if server-rendering fails

**Tailwind Not Working:**
- Ensure `global.css` is imported in BaseLayout.astro
- Check that `@import "tailwindcss"` is at top of `src/styles/global.css`
- Verify custom @utility directives in global.css
- Clear Tailwind cache: `rm -rf .next/` (if using Tailwind CLI)

**WebGL Component Crashes:**
- Check browser console for Three.js/WebGL errors
- Verify dispose() is called in useEffect cleanup
- Check isDisposed flag prevents post-disposal renders
- Monitor for memory leaks (DevTools Profiler)

**GitHub Actions Deploy Fails:**
- Check Actions logs for build errors
- Verify `npm run build` succeeds locally
- Confirm sitemap.xml is in dist/
- Check gh-pages branch exists in repo settings

## Resources

### Official Documentation
- [Astro Docs](https://docs.astro.build) - Build system, routing, islands architecture
- [Tailwind CSS v4](https://tailwindcss.com/docs) - CSS-first, @theme/@utility directives
- [React Docs](https://react.dev) - Component patterns, hooks, state management
- [Nanostores Docs](https://github.com/nanostores/nanostores) - Global reactive state
- [MDX Docs](https://mdxjs.com) - Blog content authoring

### Project Documentation
- **Fork Risk Monitoring** - `.claude/CLAUDE.md` references
- **Technical Architecture** - Component patterns, state management
- **Blog Structure** - Content frontmatter, MDX syntax (docs/blog.md)

### Project Reference Files
- `react-integration.md` - React hydration patterns
- `tailwind-setup.md` - Tailwind v4 CSS-first configuration
- `content-collections.md` - Blog & learn content setup
- `view-transitions.md` - Page transition animations
- `github-actions.md` - CI/CD GitHub Actions workflows

## Updating This Skill

Astro and its ecosystem evolve rapidly. To update:
1. Search for latest Astro documentation
2. Update reference files with new patterns
3. Add new scripts for common workflows
4. Test changes with real projects
5. Repackage the skill

## Version Information

Project stack versions:
- **Astro** 5.10+
- **React** 19.x
- **Tailwind CSS** 4.x
- **Nanostores** (latest)
- **@astrojs/mdx** (for blog)
- **@astrojs/rss** (for feed)
- **Node.js** 18+

Last updated: February 2026

## Critical Reminders

- **NOT Cloudflare Workers** - This project uses GitHub Pages static deployment
- **Nanostores required** - Global state MUST use Nanostores + useAtom, never useState
- **Dual TypeScript configs** - Frontend (tsconfig.app.json) and scripts (tsconfig.scripts.json)
- **WebGL lifecycle** - dispose() + isDisposed guard pattern is non-negotiable
- **SVG > Canvas** - Prefer SVG for resolution-independent visualizations
- **Hydration directives required** - All React components need `client:*` directive or they won't be interactive
- **GitHub Pages CI/CD** - Actions workflow handles build and deployment to gh-pages branch

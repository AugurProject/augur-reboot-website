# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CRITICAL OVERRIDES - FOLLOW EXACTLY

## Development Server Behavior
**NEVER** spawn new dev servers - **ALWAYS** check `lsof -ti:4321` first
**MUST** use existing server on localhost:4321 for all testing  
**DO NOT** wait for `npm run dev` to complete before proceeding with other tasks

## Styling Architecture
**ALWAYS** look in `src/styles/global.css` for ALL styling customization
**MUST** use `@theme` directive for theme customization - NO config files
**NEVER** assume tailwind.config.js exists - this project uses CSS-first approach
**ALWAYS** use `@utility` directive for custom utilities like `fx-glow`

## Multi-Agent Coordination  
**MUST** use agile-project-orchestrator for complex implementations requiring multiple specialists
**ALWAYS** break complex features into parallel workstreams, delegate to specialized agents, avoid single-agent bottlenecks

## Architectural Principles
**NEVER** add state management logic to rendering components - state belongs in stores
**ALWAYS** make rendering components purely reactive to state - no URL detection or navigation logic
**NEVER** add "safety fallbacks" or "defensive code" that violates separation of concerns
**ALWAYS** handle page initialization logic in store initialization, not component effects

## Deployment & SEO Architecture
**CRITICAL**: Production deployment is GitHub Pages (static), NOT Cloudflare
**NEVER** add site URL to Cloudflare config - only needed for GitHub Pages production builds
**ALWAYS** remember: sitemap generation happens in GitHub Actions, not local development
**MUST** ensure SEO features work in static output mode for production

## WebGL & Resource Management
**ALWAYS** implement proper dispose() methods for WebGL resources (buffers, programs, shaders)
**MUST** call dispose() in React component cleanup effects to prevent GPU memory leaks
**NEVER** render after disposal - add isDisposed guards in render methods

# CURRENT PROJECT STATE

## Active Configuration
- **Astro**: v5.10+ with React 19 integration
- **Tailwind CSS**: v4.1 via `@tailwindcss/vite` plugin (NO separate config file)
- **Production Deployment**: GitHub Pages (static) - main branch auto-deploys to https://augur.net
- **Development Environment**: Cloudflare adapter (SSR) for local development
- **Dev Server**: localhost:4321 (check with `lsof -ti:4321`)

## Project Structure
```
src/
├── styles/global.css      # Tailwind v4 @theme + @utility directives  
├── components/            # Component types by rendering
│   ├── *.astro           # Server-rendered (static)
│   └── *.tsx             # Client-hydrated (interactive)
├── stores/               # Nanostores state management
├── assets/               # Static SVGs and resources  
├── lib/                  # Shared utilities
├── layouts/              # Base page layouts
└── pages/                # Route definitions
```

## Custom Utilities Available
- `fx-glow` - Drop shadow with primary color glow
- `fx-glow-*` - Variable glow sizes (sm, lg)
- `fx-box-glow` - Box shadow glow effects
- `fx-box-glow-*` - Variable box glow sizes

## Project Overview
Astro-based teaser website for the Augur prediction market reboot. Retro-futuristic landing page with CRT-style animations, deployed on Cloudflare Pages with React components for interactivity.

# DEVELOPMENT WORKFLOW

## Before Making Changes
1. **CHECK**: Is dev server running? `lsof -ti:4321`
2. **REFERENCE**: Use project structure tree above to locate styling, components, and state
3. **PATTERN**: Follow Tailwind v4 @theme/@utility patterns in styles/global.css

## Development Commands
| Command | Action |
|---------|---------|
| `npm run dev` | Start development server at localhost:4321 |
| `npm run build` | Build production site to ./dist/ |
| `npm run preview` | Build and preview with Wrangler (Cloudflare) |
| `npm run deploy` | Deploy to Cloudflare Pages |
| `npm run cf-typegen` | Generate Cloudflare Worker types |

# REFERENCE - Architecture & Components

## Framework Stack
- **Astro 5.10+** - Static site generator with component islands
- **React 19** - For interactive components (client-side hydration)
- **Tailwind CSS 4.1** - CSS-first styling approach
- **Cloudflare Pages** - Static hosting with edge functions
- **Wrangler** - Cloudflare deployment tooling

## Component Architecture
- **Astro Components** (.astro) - Server-rendered layout and static components
- **React Components** (.tsx) - Interactive elements requiring client-side JavaScript  
- **Hybrid Approach** - Uses `client:load` and `client:only` directives for selective hydration

## Key Components
- `Intro.tsx` - Interactive terminal-style intro with typewriter effects
- `PerspectiveGridTunnel.tsx` - Animated 3D perspective grid background
- `CrtDisplay.tsx` - CRT monitor simulation with power-on/off animations
- `TypewriterSequence.tsx` - Sequential text animation system
- `HeroBanner.astro` - Main hero section with social links
- `MissionSection.astro` - Technical specification display sections

## Pages Structure
- `index.astro` - Landing page with intro sequence and hero banner  
- `mission.astro` - Technical roadmap with detailed protocol specifications
- `Layout.astro` - Base HTML layout with global styles and fonts

## Client-Side Hydration
Components requiring interactivity use Astro's client directives:
- `client:only="react"` - Components that only run on client
- `client:load` - Hydrate immediately on page load

## Animation System
The site uses CSS keyframes for CRT-style effects and JavaScript for typewriter animations. The PerspectiveGridTunnel component creates the signature animated background.

## View Transitions Architecture
**REFERENCE**: @docs/view-transitions-design.md - Comprehensive design document for smooth page navigation, animation continuity, and state management patterns.

# EXTENDED KNOWLEDGE

## Updated Astro Patterns
**ALWAYS**: Refer to these docs before Context7 and WebFetch

- **@.claude/docs/astro-authentication.md** - Latest auth integration patterns (Auth.js, Better Auth, Clerk, Lucia)
- **@.claude/docs/astro-framework-components.md** - Current hydration strategies and multi-framework composition
- **@.claude/docs/astro-images.md** - Modern image optimization and responsive layout systems
- **@.claude/docs/astro-middleware.md** - Updated middleware patterns and request handling
- **@.claude/docs/astro-server-islands.md** - Server islands implementation with `server:defer`
- **@.claude/docs/astro-styling.md** - Scoped styles, dynamic CSS variables, and class composition patterns
- **@.claude/docs/astro-typescript.md** - Latest TypeScript integration and utility types
- **@.claude/docs/astro-view-transitions.md** - View transitions API and SPA-mode patterns

## Task Master AI Integration
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

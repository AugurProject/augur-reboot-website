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
│   ├── *.tsx             # Client-hydrated (interactive)
│   ├── ForkMonitor.tsx   # Real-time fork risk gauge with demo integration
│   ├── ForkGauge.tsx     # SVG-based percentage visualization
│   ├── ForkStats.tsx     # Data panels for risk metrics
│   ├── ForkDisplay.tsx   # Main display component
│   ├── ForkControls.tsx  # Development-only demo controls (F2)
│   └── ForkBadge.tsx     # Badge component for fork status
├── providers/            # React Context providers
│   ├── ForkDataProvider.tsx # Fork risk data loading with auto-refresh
│   └── ForkMockProvider.tsx # Demo mode state management
├── scripts/              # Node.js blockchain data collection
│   └── calculate-fork-risk.ts # Ethereum contract interaction with RPC failover
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

**NEW**: Integrated real-time fork risk monitoring system displaying Augur v2 protocol fork risk based on active dispute bonds. Features automated blockchain data collection, interactive gauge visualization, and development demo modes.

# DEVELOPMENT WORKFLOW

## Before Making Changes
1. **CHECK**: Is dev server running? `lsof -ti:4321`
2. **REFERENCE**: Use project structure tree above to locate styling, components, and state
3. **PATTERN**: Follow Tailwind v4 @theme/@utility patterns in styles/global.css

## Development Commands

**Core Development**
| Command | Action |
|---------|---------|
| `npm run dev` | Start development server at localhost:4321 |
| `npm run build` | Build production site to ./dist/ |
| `npm run preview` | Build and preview with Wrangler (Cloudflare) |
| `npm run deploy` | Deploy to Cloudflare Pages |
| `npm run cf-typegen` | Generate Cloudflare Worker types |

**Data & Risk Calculation**
| Command | Action |
|---------|---------|
| `npm run build:fork-data` | Calculate fork risk data using TypeScript scripts (requires Node.js 22+ with --experimental-strip-types) |
| `npm run typecheck` | Type-check all TypeScript files using project references |
| `npm run lint` | Run Biome linter with tab indentation and single quotes |

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

**Core Website Components**
- `Intro.tsx` - Interactive terminal-style intro with typewriter effects
- `PerspectiveGridTunnel.tsx` - Animated 3D perspective grid background
- `CrtDisplay.tsx` - CRT monitor simulation with power-on/off animations
- `TypewriterSequence.tsx` - Sequential text animation system
- `HeroBanner.astro` - Main hero section with social links
- `MissionSection.astro` - Technical specification display sections

**Fork Risk Monitoring Components**
- `ForkMonitor.tsx` - Main component integrating gauge, data panels, and demo controls
- `ForkGauge.tsx` - Animated SVG gauge showing risk percentage (0-100%)
- `ForkStats.tsx` - Responsive grid displaying risk level, REP staked, and dispute count
- `ForkDisplay.tsx` - Display component orchestrating gauge and stats
- `ForkControls.tsx` - Development-only overlay with demo scenarios (production-safe)
- `ForkBadge.tsx` - Badge component for fork status display
- `ForkDataProvider.tsx` - Data provider with 5-minute auto-refresh and error handling
- `ForkMockProvider.tsx` - Demo state management with scenario generation

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

# FORK RISK MONITORING SYSTEM

## Architecture Overview
The fork risk monitoring system uses a dual-runtime architecture with TypeScript project references:

**Frontend Runtime (Astro + React)**
- Config: `tsconfig.app.json` 
- Location: `src/` directory
- Purpose: Interactive web UI with gauge visualization and data panels
- Key patterns: React Context for state management, 5-minute auto-refresh, demo mode integration

**Backend Scripts (Node.js)**
- Config: `tsconfig.scripts.json`
- Location: `scripts/` directory  
- Purpose: Ethereum blockchain data collection and risk calculation
- Uses Node.js 22's native TypeScript support via --experimental-strip-types

## Data Flow & Risk Calculation
1. **Collection**: GitHub Actions runs `calculate-fork-risk.ts` hourly with RPC failover
2. **Storage**: Results saved to `public/data/fork-risk.json` (gitignored for fresh data)
3. **Consumption**: Frontend loads JSON via ForkRiskContext provider with auto-refresh
4. **Visualization**: React components render risk data in interactive SVG gauge

**Risk Formula**: `(Largest Dispute Bond / 275,000 REP) × 100 = Risk %`

## Key Development Patterns

**React Context Architecture**
- `ForkRiskContext.tsx` - Manages fork risk data loading with 5-minute refresh cycle
- `DemoContext.tsx` - Handles demo mode state with 5 risk scenarios (dev-only)
- Auto-failover to default data on fetch errors

**Demo Mode System (Development Only)**
- Activation: `F2` keyboard shortcut
- Scenarios: None, Low (1-10%), Moderate (10-25%), High (25-75%), Critical (75-98%)
- Production Safety: `if (!isDemoAvailable) return null` guards prevent demo in production builds

**TypeScript Project References**
- Root `tsconfig.json` coordinates both runtimes via project references
- `tsconfig.app.json` - Astro frontend with React integration
- `tsconfig.scripts.json` - Node.js scripts with ethers.js blockchain interaction
- Build cache in `.tscache/` (gitignored)

## Blockchain Integration Details
- **Smart Contracts**: Augur v2 mainnet addresses with ABI definitions in `contracts/augur-abis.json`
- **Event Monitoring**: Tracks three key events for accurate dispute assessment:
  - `DisputeCrowdsourcerCreated` (dispute initialization)
  - `DisputeCrowdsourcerContribution` (actual REP stakes - PRIMARY)
  - `DisputeCrowdsourcerCompleted` (exclude finished disputes)
- **RPC Endpoints**: Automatic failover across LlamaRPC, LinkPool, PublicNode, 1RPC
- **No API Keys**: Uses only public endpoints for zero-cost infrastructure
- **Error Handling**: Graceful degradation with fallback to cached/default data
- **Critical Fix**: Now uses actual contributed REP amounts (prevents 75x+ underestimation of fork risk)

## GitHub Actions Integration
- **Workflow**: `.github/workflows/sync-to-gh-pages.yml` runs `npm run build:fork-data` before build
- **Schedule**: Hourly cron job + manual dispatch with custom RPC URL support
- **Deployment**: Fresh data calculated and committed with each deployment

## Development Commands Specific to Fork Risk

```bash
# Calculate fresh fork risk data locally
npm run build:fork-data

# Check RPC endpoint being used
cat public/data/fork-risk.json | grep -A 3 "rpcInfo"

# Enable demo mode in development
# Press F2 in browser, then select risk scenarios
```

# Project Architecture

## Framework Stack
- **Astro 5.10+** - Static site generator with component islands
- **React 19** - For interactive components (client-side hydration)
- **Tailwind CSS 4.1** - CSS-first styling approach via `@tailwindcss/vite` plugin (NO separate config file)
- **Cloudflare Pages** - Static hosting with edge functions
- **Wrangler** - Cloudflare deployment tooling

## Environment Setup
- **Production Deployment**: GitHub Pages (static) - main branch auto-deploys to https://augur.net
- **Development Environment**: Cloudflare adapter (SSR) for local development
- **Dev Server**: localhost:4321 (check with `lsof -ti:4321`)

## Project Structure
```
├── src/
│   ├── styles/                    # Global styles and Tailwind configuration
│   │   └── global.css            # CSS-first approach with @theme/@utility directives
│   ├── components/               # All UI components
│   │   ├── *.astro              # Server-rendered static components
│   │   ├── *.tsx                # Client-interactive components
│   │   ├── ForkMonitor.tsx      # Fork risk monitoring suite
│   │   ├── ForkGauge.tsx        # ├── SVG gauge visualization
│   │   ├── ForkStats.tsx        # ├── Data panels component
│   │   ├── ForkDisplay.tsx      # ├── Layout orchestrator
│   │   ├── ForkControls.tsx     # ├── Development demo controls
│   │   └── ForkBadge.tsx        # └── Status indicator badge
│   ├── providers/               # React Context providers
│   │   ├── ForkDataProvider.tsx # Production data loading with auto-refresh
│   │   └── ForkMockProvider.tsx # Demo mode state management
│   ├── scripts/                 # Node.js data collection scripts
│   │   └── calculate-fork-risk.ts # Ethereum contract interaction with RPC failover
│   ├── stores/                  # Nanostores global state management
│   ├── assets/                  # Static resources (SVGs, images)
│   ├── lib/                     # Shared utilities and helper functions
│   ├── layouts/                 # Page layout components
│   └── pages/                   # Route definitions and page components
├── .github/
│   └── workflows/               # GitHub Actions CI/CD
│       └── build-and-deploy.yml # Automated deployment to GitHub Pages
├── public/                      # Static files served directly
│   └── data/                   # Generated data files
│       └── fork-risk.json      # Fork risk calculation results (gitignored)
├── contracts/                   # Smart contract definitions
│   └── augur-abis.json         # Augur v2 contract ABIs
├── .workbench/                 # Development worktrees (gitignored)
└── .tscache/                   # TypeScript build cache (gitignored)
```

## Component Architecture

### Fork Risk Monitoring System
Hierarchical component organization:
```
ForkMonitor (main container)
├── ForkDisplay (layout orchestrator)
│   ├── ForkGauge (SVG visualization)
│   └── ForkStats (data panels)
├── ForkControls (development tools)
└── ForkBadge (status indicator)

Data Flow:
ForkDataProvider → ForkRiskContext → Components
ForkMockProvider → DemoContext → Components (dev mode)
```

### Component Types
- **`.astro` files**: Server-rendered static components (hero sections, layouts)
- **`.tsx` files**: Client-interactive components requiring hydration
- **Providers**: React Context wrappers for data management
- **Pages**: Route definitions combining layouts and components

## CI/CD Pipeline Architecture
GitHub Actions workflow (`build-and-deploy.yml`):
1. **Trigger**: Push to main branch or hourly cron
2. **Data Collection**: Runs `calculate-fork-risk.ts` with RPC failover
3. **Build**: Astro static site generation with fork risk data
4. **Deploy**: Automated deployment to GitHub Pages
5. **Monitoring**: Hourly updates ensure fresh fork risk data

## Project Overview
Astro-based teaser website for the Augur prediction market reboot. Retro-futuristic landing page with CRT-style animations, deployed on GitHub Pages with React components for interactivity.

**Key Feature**: Real-time fork risk monitoring system displaying Augur v2 protocol fork risk based on active dispute bonds. Features automated blockchain data collection, interactive gauge visualization, and development demo modes.

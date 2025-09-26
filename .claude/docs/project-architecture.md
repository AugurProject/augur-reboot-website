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
Astro-based teaser website for the Augur prediction market reboot. Retro-futuristic landing page with CRT-style animations, deployed on GitHub Pages with React components for interactivity.

**Key Feature**: Integrated real-time fork risk monitoring system displaying Augur v2 protocol fork risk based on active dispute bonds. Features automated blockchain data collection, interactive gauge visualization, and development demo modes.
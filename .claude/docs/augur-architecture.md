## Project Overview
Astro-based teaser website for the Augur prediction market reboot. Retro-futuristic landing page with CRT-style animations, deployed on GitHub Pages with React components for interactivity.

**Key Feature**: Real-time fork risk monitoring system displaying Augur v2 protocol fork risk based on active dispute bonds. Features automated blockchain data collection, interactive gauge visualization, and development demo modes.

## Tech Stack
- **Astro 5.10+** - Static site generator with component islands
- **React 19** - For interactive components (client-side hydration)
- **Tailwind CSS 4.1** - CSS-first styling approach via `@tailwindcss/vite` plugin
- **Wrangler** - Cloudflare deployment tooling
- **Cloudflare Workers** - Static hosting with edge functions
- **GitHub & GitHub Pages** - Version control and primary deployment environment

## Codebase Structure
```
├── src/
│   ├── styles/                  # Global styles
│   │   └── global.css           # Tailwind configuration
│   ├── components/              # All UI components
│   │   ├── *.astro              # Server-rendered static components
│   │   ├── *.tsx                # Client-interactive components
│   │   └── [COMPONENT_GROUP]    # Complex component grouped in it's own folder
│   │       ├── *.astro          # Server-rendered static components
│   │       └── *.tsx            # Client-interactive components
│   ├── providers/               # React Context providers
│   ├── scripts/                 # Backend scripts
│   ├── stores/                  # Nanostores global state management
│   ├── assets/                  # Static resources (SVGs, images)
│   ├── lib/                     # Shared utilities and helper functions
│   ├── layouts/                 # Page layout components
│   └── pages/                   # Route definitions and page components
├── .github/
│   └── workflows/               # GitHub Actions CI/CD
│       └── *.yml                # GitHub Actions definition file 
├── public/                      # Static files served directly
│   └── data/                    # Generated files or publicly available data
├── contracts/                   # Smart contract definitions
│   └── augur-abis.json          # Augur v2 contract ABIs
└── .workbench/                  # Development worktrees (gitignored)
```

## Environments
- **Production Deployment**: GitHub Pages (static) - main branch auto-deploys to https://augur.net
- **Staging Environment**: Cloudflare Workers via Astro plugin
- **Dev Server**: Defaults to localhost:4321

## CI/CD Pipeline Architecture
GitHub Actions workflow (`build-and-deploy.yml`):
1. **Trigger**: Push to main branch or hourly cron
2. **Data Collection**: Runs `calculate-fork-risk.ts` with RPC failover
3. **Build**: Astro static site generation with fork risk data
4. **Deploy**: Automated deployment to GitHub Pages
5. **Monitoring**: Hourly updates ensure fresh fork risk data


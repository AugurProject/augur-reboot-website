# Augur Reboot Website

This repository contains the source code for the teaser website announcing the reboot of the Augur prediction market. The site serves as a retro-futuristic landing page showcasing the redevelopment of Augur and offering a glimpse into the future of decentralized forecasting.

The future home of the Augur platform will be: **[https://augur.net](https://augur.net)**

---

## Technical Architecture

This is a modern static website built with cutting-edge web technologies:

- **Astro 5.10+** - Static site generator with selective client-side hydration
- **React 19** - Interactive components with concurrent features
- **Tailwind CSS 4.1** - Utility-first styling with @theme directive approach
- **TypeScript** - Full type safety across components and utilities
- **Nanostores** - Lightweight state management for cross-component communication
- **ethers.js 6** - Ethereum blockchain interaction for fork risk monitoring

### Deployment Strategy

The project supports dual deployment architecture with clear separation of purposes:

**Production Deployment:**
- **GitHub Pages** - Primary production deployment at `https://augur.net`
- Automatically deploys from `main` branch via GitHub Actions
- Uses static site generation (`output: 'static'`)
- Handles sitemap generation and SEO optimization

**Development Environment:**
- **Cloudflare Pages** - Local development and preview environment
- Uses server-side rendering capabilities (`output: 'server'`)
- Provides Wrangler integration for edge computing features
- Optimized for development workflow and testing

## Key Features

- **Retro-Futuristic Design**: CRT monitor aesthetics with power-on/off animations
- **3D Perspective Grid**: WebGL-powered animated tunnel background
- **Interactive Intro Sequence**: Terminal-style typewriter effects with smart skip functionality
- **Fork Risk Monitoring**: Real-time Augur v2 fork risk assessment with interactive gauge
- **Blockchain Integration**: Automated hourly data collection from Ethereum mainnet
- **Demo Mode**: Development-only testing interface for risk scenarios
- **View Transitions**: Smooth page navigation with animation continuity
- **Responsive Layout**: Optimized for desktop and mobile experiences
- **Performance Optimized**: Static-first with selective hydration for interactivity

## Project Structure

```
src/
├── components/           # React and Astro components
│   ├── *.astro          # Server-rendered static components
│   ├── *.tsx            # Client-hydrated interactive components
│   ├── ForkMeter.tsx    # Real-time fork risk gauge
│   ├── GaugeDisplay.tsx # SVG-based risk visualization
│   └── DemoOverlay.tsx  # Development-only demo controls
├── contexts/            # React Context providers
│   ├── ForkRiskContext.tsx # Fork risk data management
│   └── DemoContext.tsx  # Demo mode state
├── pages/               # Route definitions
│   ├── index.astro      # Landing page with intro sequence
│   ├── mission.astro    # Technical roadmap
│   └── team.astro       # Team information
├── scripts/             # Node.js blockchain data collection
│   └── calculate-fork-risk.ts # Ethereum contract interaction
├── layouts/             # Base page layouts
├── stores/              # Nanostores state management
├── styles/              # Tailwind CSS with custom utilities
└── assets/              # Static SVGs and resources
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/en/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Setup

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

### Development Commands

All commands are run from the root of the project:

**Core Development**
| Command           | Action                                                    |
| :---------------- | :-------------------------------------------------------- |
| `npm run dev`     | Starts development server at `localhost:4321`            |
| `npm run build`   | Builds production site to `./dist/`                      |
| `npm run preview` | Builds and previews with Wrangler (Cloudflare)          |
| `npm run deploy`  | Deploys to Cloudflare Pages                              |
| `npm run cf-typegen` | Generates Cloudflare Worker types                     |

**Fork Risk Monitoring**
| Command                    | Action                                                |
| :------------------------- | :---------------------------------------------------- |
| `npm run build:fork-data`  | Calculate fork risk data using blockchain scripts     |
| `npm run typecheck`        | Type-check all TypeScript files                       |
| `npm run lint`             | Run Biome linter with project standards               |

### Development Workflow

The development server provides:
- Hot module replacement for rapid iteration
- TypeScript checking and error reporting
- Tailwind CSS compilation with custom utilities
- React component hydration in development mode

For development questions or issues, refer to the project documentation in the `docs/` directory or check the component implementations for usage patterns.

### Styling System

The project uses Tailwind CSS 4.1 with a CSS-first approach:

- **Global Styles**: Located in `src/styles/global.css`
- **Theme Configuration**: Uses `@theme` directive instead of config files
- **Custom Utilities**: Defined with `@utility` directive
- **Component Styles**: Scoped styles within Astro components

## Deployment

### Environment Detection

The project automatically detects the deployment environment:

```javascript
// Check if building in GitHub Actions (for GitHub Pages)
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

// Configuration selection
...(isGitHubActions ? gitHubPagesConfig : cloudflareConfig)
```

### Automatic Syncing & Data Updates

**GitHub Actions Environment:**
- Triggers static site generation with sitemap
- Optimized for production deployment
- Uses `https://augur.net` as canonical site URL
- Generates SEO-optimized meta tags and structured data

**Local Development Environment:**
- Uses Cloudflare adapter for SSR capabilities
- Provides development server at `localhost:4321`
- Enables real-time preview of changes
- No sitemap generation (not needed for development)

Changes to the main branch trigger an automated workflow that:
1. Syncs source code changes to the `gh-pages` branch
2. Preserves deployment-specific configurations
3. **Calculates fresh fork risk data** from Ethereum mainnet
4. Updates the live site with current dispute bond metrics from actual contribution events
5. Maintains both deployment targets without manual intervention
6. Ensures consistency across both hosting platforms

**Fork Risk Data Collection:**
- Runs automatically every hour via GitHub Actions
- Uses public Ethereum RPC endpoints with failover
- Monitors Augur v2 dispute events for accurate stake tracking and fork risk calculation
- Zero infrastructure costs - completely serverless data pipeline

### Manual Deployment

To deploy manually to Cloudflare Pages:
```sh
npm run deploy
```

## Fork Risk Monitoring System

### Overview
The website features a real-time fork risk monitoring system for Augur v2, displaying the current risk of a protocol fork based on active dispute bonds. This system uses blockchain event data to accurately track REP contributions and calculate risk percentages with an interactive gauge visualization.

### Architecture
- **Data Collection**: Node.js scripts using ethers.js to query Ethereum mainnet
- **Storage**: Static JSON files updated via GitHub Actions (zero infrastructure cost)  
- **Frontend**: React Context API for state management with 5-minute auto-refresh
- **Visualization**: Custom SVG gauge with animated risk levels

### Risk Calculation
Fork risk is calculated using the simple formula:
```
Risk % = (Largest Dispute Bond / 275,000 REP) × 100
```

Where 275,000 REP represents the fork threshold (2.5% of total REP supply).

### Data Sources
- **RPC Endpoints**: LlamaRPC, LinkPool, PublicNode, 1RPC (public endpoints with automatic failover)
- **Failover**: Automatic fallback across 4 RPC providers
- **Update Frequency**: Hourly via GitHub Actions, 5-minute UI refresh

### Development Features
In development mode, access demo controls with `Ctrl+Shift+D`:
- **No Disputes**: Clean baseline state
- **Low Risk**: 0.4-10% of fork threshold scenarios  
- **Moderate Risk**: 10-25% threshold scenarios
- **High Risk**: 25-75% threshold scenarios
- **Critical Risk**: 75-98% threshold scenarios

Demo mode is automatically disabled in production builds.

# Augur Reboot Website

Source for the Augur reboot website at [www.augur.net](https://www.augur.net).

The site is an Astro + React frontend for Augur reboot content, blog/learn pages, and a fork-risk monitor backed by periodically generated on-chain data.

## Stack

- **Astro 5** with selective React islands
- **React 19** for interactive components
- **Tailwind CSS 4** via CSS-first `@theme` / `@utility` directives
- **Biome** for linting
- **TypeScript** with separate app/script configs
- **ethers.js 6** for fork-risk data collection
- **GitHub Actions + GitHub Pages** for production deployment
- **Cloudflare Workers/Wrangler** for local preview and manual deploy paths

## Repository Layout

```text
src/
├── components/          # Astro + React UI components
├── content/             # Blog and Learn content collections
├── layouts/             # Page/content layouts
├── lib/                 # Shared utilities and rehype plugins
├── pages/               # Astro routes
├── providers/           # React context providers for fork monitor data/demo state
├── styles/              # Tailwind v4 CSS-first global stylesheet
├── types/               # Shared TypeScript types
└── utils/               # Client-side helpers and demo data

scripts/
├── calculate-fork-risk.ts
└── probe-fork-state.ts

public/
├── cache/event-cache.json
└── data/fork-risk.json

docs/
├── INDEX.md
└── ...project documentation
```

Start with [`docs/INDEX.md`](docs/INDEX.md) for deeper architecture, fork-monitoring, protocol, and feature documentation.

## Development

### Prerequisites

- Node.js 22, matching CI
- npm

### Setup

```sh
npm install
```

### Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Astro dev server at `localhost:4321` |
| `npm run typecheck` | Run Astro/TypeScript checks |
| `npm run lint` | Run Biome lint using the local dependency |
| `npm run build` | Build the site |
| `npm run build:gh-pages` | Build with GitHub Actions/GitHub Pages mode enabled |
| `npm run build:fork-data` | Generate `public/data/fork-risk.json` from on-chain data |
| `npm run preview` | Build then preview with Wrangler |
| `npm run deploy` | Build then deploy with Wrangler |
| `npm run cf-typegen` | Generate Cloudflare binding types |

Before declaring work done, run:

```sh
npm run typecheck
npm run lint
npm run build
```

## Configuration

Astro chooses deployment mode from environment:

- `GITHUB_ACTIONS=true` → static GitHub Pages build (`output: "static"`)
- otherwise → Cloudflare adapter/server build for local Wrangler workflows

Production site metadata uses environment variables supplied in CI:

- `SITE_URL`
- `BASE_PATH`
- `PUBLIC_GA_ID`

## Fork Risk Monitoring

The fork monitor is documented in:

- [`docs/fork-mechanics.md`](docs/fork-mechanics.md) — protocol context
- [`docs/fork-monitoring-pipeline.md`](docs/fork-monitoring-pipeline.md) — CI/data pipeline
- [`docs/fork-monitoring-methodology.md`](docs/fork-monitoring-methodology.md) — calculation method

## Demo Mode

In development, press **F2** to toggle fork-monitor demo controls. Demo scenarios are development-only and are disabled in production builds.

## Styling

Tailwind is configured CSS-first in [`src/styles/global.css`](src/styles/global.css):

- `@theme` defines design tokens.
- `@utility` defines custom utility families.
- There is no `tailwind.config.js`.

Biome is configured in [`biome.json`](biome.json), including Tailwind directive parsing for CSS.

## CI/CD

[`build-and-deploy.yml`](.github/workflows/build-and-deploy.yml) runs on:

- hourly schedule
- pushes to `main`
- pull requests targeting `main`
- manual workflow dispatch

Jobs:

1. **risk-monitor** — install dependencies, generate fork-risk data, upload artifact
2. **build** — typecheck, lint, build, upload GitHub Pages artifact
3. **deploy** — deploy GitHub Pages artifact on `main`

## Worktrees

Use raw Git worktrees under `.worktrees/` when parallel branch checkouts are useful:

```sh
git fetch origin
git worktree add -b feature/example .worktrees/feature-example origin/main
```

Remove when done:

```sh
git worktree remove .worktrees/feature-example
git worktree prune
```

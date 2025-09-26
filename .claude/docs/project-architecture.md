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

## Project Organization Principles

### Directory Structure Guidelines
- **`src/styles/`** - Global styles and Tailwind configuration (CSS-first approach)
- **`src/components/*.astro`** - Server-rendered, static components
- **`src/components/*.tsx`** - Client-side interactive components requiring hydration
- **`src/providers/`** - React Context providers for state management
- **`src/scripts/`** - Node.js scripts for data collection and build processes
- **`src/stores/`** - Nanostores for global state management
- **`src/assets/`** - Static resources (SVGs, images, etc.)
- **`src/lib/`** - Shared utilities and helper functions
- **`src/layouts/`** - Page layout components
- **`src/pages/`** - Route definitions and page components

### Component Organization
- **Static content**: Use `.astro` components for server-rendered content
- **Interactive features**: Use `.tsx` components with appropriate client directives
- **State management**: Separate providers from presentation components
- **Shared logic**: Extract to `/lib` utilities when used across components

### File Discovery
Use `git ls-files` or similar tools to find specific files within this structure.

## Project Overview
Astro-based teaser website for the Augur prediction market reboot. Retro-futuristic landing page with CRT-style animations, deployed on GitHub Pages with React components for interactivity.

**Key Feature**: Integrated real-time fork risk monitoring system displaying Augur v2 protocol fork risk based on active dispute bonds. Features automated blockchain data collection, interactive gauge visualization, and development demo modes.

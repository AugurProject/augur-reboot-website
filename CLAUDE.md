# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based teaser website for the Augur prediction market reboot. The site is designed for deployment on Cloudflare Pages and uses React components within Astro pages. The project creates a retro-futuristic landing page with CRT-style animations and a technical mission statement.

## Development Commands

| Command | Action |
|---------|---------|
| `npm run dev` | Start development server at localhost:4321 |
| `npm run build` | Build production site to ./dist/ |
| `npm run preview` | Build and preview with Wrangler (Cloudflare) |
| `npm run deploy` | Deploy to Cloudflare Pages |
| `npm run cf-typegen` | Generate Cloudflare Worker types |

## Architecture

### Framework Stack
- **Astro 5.10+** - Static site generator with component islands
- **React 19** - For interactive components (client-side hydration)
- **Tailwind CSS 4.1** - Utility-first styling with custom theme
- **Cloudflare Pages** - Static hosting with edge functions
- **Wrangler** - Cloudflare deployment tooling

### Component Architecture
- **Astro Components** (.astro) - Server-rendered layout and static components
- **React Components** (.tsx/.jsx) - Interactive elements requiring client-side JavaScript
- **Hybrid Approach** - Uses `client:load` and `client:only` directives for selective hydration

### Key Components
- `Intro.tsx` - Interactive terminal-style intro with typewriter effects
- `PerspectiveGridTunnel.tsx` - Animated 3D perspective grid background
- `CrtDisplay.tsx` - CRT monitor simulation with power-on/off animations
- `TypewriterSequence.tsx` - Sequential text animation system
- `HeroBanner.astro` - Main hero section with social links
- `MissionSection.astro` - Technical specification display sections

### Styling System
- **Custom Tailwind Theme** - Defines primary green (#2AE7A8), background (#111111), and typography
- **CSS Animations** - Custom keyframes for CRT effects, blinking cursors, and gradient animations
- **Font Loading** - Google Fonts integration for "Press Start 2P" (retro) and "Barlow" (modern)

### Pages Structure
- `index.astro` - Landing page with intro sequence and hero banner
- `mission.astro` - Technical roadmap with detailed protocol specifications
- `Layout.astro` - Base HTML layout with global styles and fonts

### Deployment Configuration
- **Cloudflare Adapter** - Configured for edge deployment with image optimization
- **Wrangler Config** - Asset binding and Node.js compatibility flags
- **TypeScript** - Strict mode with React JSX support

## Development Notes

### Client-Side Hydration
Components requiring interactivity use Astro's client directives:
- `client:only="react"` - Components that only run on client
- `client:load` - Hydrate immediately on page load

### Animation System
The site uses CSS keyframes for CRT-style effects and JavaScript for typewriter animations. The PerspectiveGridTunnel component creates the signature animated background.

### Content Structure
Mission specifications are defined as structured data in `mission.astro` and rendered through reusable MissionSection components.

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

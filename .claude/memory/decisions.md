# Decisions

Architectural choices with rationale.

## Frontend Framework
Astro 5.10+ with React 19 islands architecture. Always specify hydration directives (client:load for critical animations). NEVER forget hydration—component won't be interactive.

## State Management
Nanostores for global state + React Context for providers. NEVER add state logic to components—keep them purely reactive. Initialization logic belongs in stores, not component effects.

## Styling Architecture
Tailwind v4 CSS-first via @theme/@utility directives in src/styles/global.css. See conventions.md for styling standards.

## Deployment Architecture
GitHub Pages static deployment for production. Must verify sitemap generation in GitHub Actions.

## Dual TypeScript Runtimes
Frontend and backend scripts in same repo with separate tsconfig files. Enables code sharing (types, utils) while maintaining runtime clarity.

## SVG-Based Fork Gauge
SVG provides resolution-independent visualization, GPU-accelerated animations, easy styling. Preferred over Canvas for this use case.

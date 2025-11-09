# Conventions

Team standards and project-specific practices.

## Component State Management
State in stores/context ONLY, never in components. Components are purely reactive. Initialization logic belongs in stores, not useEffect.

## Development Workflow
Check dev server before starting: `lsof -ti:4321`. Only run `npm run dev` if port is free. Always run: typecheck, lint, build before merging.

## GPU Resource Management
WebGL components MUST implement dispose() and call it in useEffect cleanup. Guard with isDisposed flag. Never render after disposal.

## Styling Standards
ALWAYS edit `src/styles/global.css` ONLY. NEVER create tailwind.config.js. Use @theme and @utility directives. Custom utils: fx-glow, fx-glow-sm/lg, fx-box-glow.

## Fork Data Refresh
ForkDataProvider refreshes every 5 minutes. Scripts/GitHub Actions update daily. Component handles stale data gracefully.

## Skill Usage
Use astro-dev skill for modern Astro framework patterns and best practices with React islands.
## Fork risk demo mode: Press F2 in dev to toggle scenarios (None, Low, Moderate, High, Critical). Dev-only with production guards—safe to leave in code.

---

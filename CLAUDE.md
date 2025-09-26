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

## WebGL & Resource Management
**ALWAYS** implement proper dispose() methods for WebGL resources (buffers, programs, shaders)
**MUST** call dispose() in React component cleanup effects to prevent GPU memory leaks
**NEVER** render after disposal - add isDisposed guards in render methods

## Deployment & SEO Architecture
**CRITICAL**: Production deployment is GitHub Pages (static), NOT Cloudflare
**NEVER** add site URL to Cloudflare config - only needed for GitHub Pages production builds
**ALWAYS** remember: sitemap generation happens in GitHub Actions, not local development
**MUST** ensure SEO features work in static output mode for production

# PROJECT IDENTIFICATION

**Project**: Augur prediction market reboot website
**Stack**: Astro 5.10+ with React 19, Tailwind CSS 4.1, deployed on GitHub Pages
**Key Feature**: Real-time fork risk monitoring system for Augur v2 protocol

# DETAILED DOCUMENTATION

## Project-Specific Documentation
- **Architecture**: `.claude/docs/project-architecture.md` - Framework stack, project structure, custom utilities
- **Development**: `.claude/docs/development-workflow.md` - Git worktrees, commands, build process
- **Fork Risk System**: `.claude/docs/fork-risk-monitoring.md` - Complete system architecture and patterns
- **Component Patterns**: `.claude/docs/component-patterns.md` - Component architecture, state management, animations

## Astro Framework Patterns
- **Authentication**: `.claude/docs/astro-authentication.md` - Auth.js, Better Auth, Clerk, Lucia integrations
- **Framework Components**: `.claude/docs/astro-framework-components.md` - Hydration strategies, multi-framework composition
- **Images**: `.claude/docs/astro-images.md` - Image optimization, responsive layouts
- **Middleware**: `.claude/docs/astro-middleware.md` - Request handling, middleware patterns
- **Server Islands**: `.claude/docs/astro-server-islands.md` - Progressive loading with `server:defer`
- **Styling**: `.claude/docs/astro-styling.md` - Scoped styles, CSS variables, class composition
- **TypeScript**: `.claude/docs/astro-typescript.md` - TypeScript integration, utility types
- **View Transitions**: `.claude/docs/astro-view-transitions.md` - SPA-mode, navigation patterns


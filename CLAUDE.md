# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CRITICAL OVERRIDES - FOLLOW EXACTLY

## Architectural Principles
**NEVER** add state management logic to rendering components - state belongs in stores
**ALWAYS** make rendering components purely reactive to state - no URL detection or navigation logic
**NEVER** add "safety fallbacks" or "defensive code" that violates separation of concerns
**ALWAYS** handle page initialization logic in store initialization, not component effects

## Multi-Agent Coordination
**MUST** use agile-project-orchestrator for complex implementations requiring multiple specialists
**ALWAYS** break complex features into parallel workstreams, delegate to specialized agents, avoid single-agent bottlenecks

## Deployment Architecture
**CRITICAL**: Production deployment is GitHub Pages (static), NOT Cloudflare
**MUST** ensure SEO features work in static output mode for production

# PROJECT IDENTIFICATION

**Project**: Augur prediction market reboot website
**Stack**: Astro 5.10+ with React 19, Tailwind CSS 4.1, deployed on GitHub Pages
**Key Feature**: Real-time fork risk monitoring system for Augur v2 protocol

# DETAILED DOCUMENTATION

## Project-Specific Documentation
- **Architecture**: `.claude/docs/augur-architecture.md` - Framework stack, organizational principles
- **Development**: `.claude/docs/augur-development-guidelines.md` - Universal development rituals and workflows
- **Styling**: `.claude/docs/augur-styling-patterns.md` - CSS utilities, Tailwind patterns, custom effects
- **Components**: `.claude/docs/augur-component-patterns.md` - Component architecture, state management, animations

## Product Requirements Documents (PRDs)
- **Fork Risk System**: `requirements/prd-fork-risk-monitoring.md` - Complete feature specification and requirements

## Astro Framework Patterns
- **Authentication**: `.claude/docs/astro-authentication.md` - Auth.js, Better Auth, Clerk, Lucia integrations
- **Framework Components**: `.claude/docs/astro-framework-components.md` - Hydration strategies, multi-framework composition
- **Images**: `.claude/docs/astro-images.md` - Image optimization, responsive layouts
- **Middleware**: `.claude/docs/astro-middleware.md` - Request handling, middleware patterns
- **Server Islands**: `.claude/docs/astro-server-islands.md` - Progressive loading with `server:defer`
- **Styling**: `.claude/docs/astro-styling.md` - Scoped styles, CSS variables, class composition
- **TypeScript**: `.claude/docs/astro-typescript.md` - TypeScript integration, utility types
- **View Transitions**: `.claude/docs/astro-view-transitions.md` - SPA-mode, navigation patterns

